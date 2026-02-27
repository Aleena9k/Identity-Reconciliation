import pool from "./db.js";

export const identifyService = async (email, phoneNumber) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Find direct matches
    const [matches] = await connection.query(
      `SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?`,
      [email, phoneNumber]
    );

    // 2️⃣ If no matches → create new PRIMARY
    if (matches.length === 0) {
      const [result] = await connection.query(
        `INSERT INTO Contact (email, phoneNumber, linkPrecedence)
         VALUES (?, ?, 'primary')`,
        [email || null, phoneNumber || null]
      );

      await connection.commit();
      return buildResponse(connection, result.insertId);
    }

    // 3️⃣ Resolve correct PRIMARY (fixes undefined.id bug)
    const primary = await resolvePrimary(connection, matches);

    // 4️⃣ Convert any other PRIMARY → SECONDARY
    for (const record of matches) {
      if (
        record.linkPrecedence === "primary" &&
        record.id !== primary.id
      ) {
        await connection.query(
          `UPDATE Contact
           SET linkPrecedence='secondary', linkedId=?
           WHERE id=?`,
          [primary.id, record.id]
        );
      }
    }

    // 5️⃣ Fetch full identity cluster
    const [cluster] = await connection.query(
      `SELECT * FROM Contact WHERE id=? OR linkedId=?`,
      [primary.id, primary.id]
    );

    // 6️⃣ Check if new info introduced
    const emailExists = cluster.some(c => c.email === email);
    const phoneExists = cluster.some(c => c.phoneNumber === phoneNumber);

    if (
      (email && !emailExists) ||
      (phoneNumber && !phoneExists)
    ) {
      await connection.query(
        `INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence)
         VALUES (?, ?, ?, 'secondary')`,
        [email || null, phoneNumber || null, primary.id]
      );
    }

    await connection.commit();

    return buildResponse(connection, primary.id);

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// 🔥 Correct Primary Resolver (Handles secondary-only matches safely)
async function resolvePrimary(connection, matches) {
  const primaryRecords = matches.filter(
    m => m.linkPrecedence === "primary"
  );

  if (primaryRecords.length > 0) {
    return primaryRecords.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    )[0];
  }

  // Only secondary found → jump to linked primary
  const linkedId = matches[0].linkedId;

  const [rows] = await connection.query(
    `SELECT * FROM Contact WHERE id = ?`,
    [linkedId]
  );

  return rows[0];
}

// 🧱 Final Response Builder
async function buildResponse(connection, primaryId) {
  const [rows] = await connection.query(
    `SELECT * FROM Contact WHERE id=? OR linkedId=?`,
    [primaryId, primaryId]
  );

  const emails = [];
  const phoneNumbers = [];
  const secondaryContactIds = [];

  for (const r of rows) {
    if (r.email && !emails.includes(r.email)) emails.push(r.email);
    if (r.phoneNumber && !phoneNumbers.includes(r.phoneNumber))
      phoneNumbers.push(r.phoneNumber);
    if (r.linkPrecedence === "secondary")
      secondaryContactIds.push(r.id);
  }

  return {
    contact: {
      primaryContatctId: primaryId,
      emails,
      phoneNumbers,
      secondaryContactIds
    }
  };
}