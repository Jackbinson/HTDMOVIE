const pool = require('../../config/database');

let hasIsUsedColumnCache = null;

const hasTicketIsUsedColumn = async () => {
  if (hasIsUsedColumnCache !== null) {
    return hasIsUsedColumnCache;
  }

  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'tickets'
       AND column_name = 'is_used'
     LIMIT 1`
  );

  hasIsUsedColumnCache = result.rows.length > 0;
  return hasIsUsedColumnCache;
};

const resetTicketSchemaCache = () => {
  hasIsUsedColumnCache = null;
};

module.exports = {
  hasTicketIsUsedColumn,
  resetTicketSchemaCache
};
