/**
 * Utilidades para gestión de índices de base de datos
 * Evita duplicación de índices y asegura que existan los necesarios
 */

/**
 * Asegura que todos los índices definidos en los modelos existan
 * Solo crea índices que realmente falten, comparando por columnas+unicidad
 */
async function ensureIndexesSmart(sequelize) {
  const queryInterface = sequelize.getQueryInterface();

  function normalizeColumns(columns) {
    return columns
      .map(c => (typeof c === 'string' ? c : c.attribute || c.name || c))
      .map(s => String(s))
      .sort();
  }

  function areSameIndex(existingIdx, desiredFields, desiredUnique) {
    const existingCols = (existingIdx.columns || existingIdx.column_names || existingIdx.fields || existingIdx.attributes || [])
      .map(c => String(c)).sort();
    const desiredCols = normalizeColumns(desiredFields);
    const existingIsUnique = !!(existingIdx.unique || existingIdx.indisunique || existingIdx.non_unique === 0);
    return JSON.stringify(existingCols) === JSON.stringify(desiredCols) && existingIsUnique === !!desiredUnique;
  }

  function buildDeterministicName(tableName, fields, isUnique) {
    const cols = normalizeColumns(fields).join('_');
    return `${String(tableName).toLowerCase()}_${cols}_${isUnique ? 'unique' : 'idx'}`;
  }

  const models = sequelize.models;

  for (const modelName of Object.keys(models)) {
    const model = models[modelName];
    const tableName = model.getTableName();
    if (!tableName) continue;

    const desired = [];

    // Índices declarados en el modelo (si existieran)
    const modelIndexes = Array.isArray(model.options?.indexes) ? model.options.indexes : [];
    for (const idx of modelIndexes) {
      if (!idx || !idx.fields || idx.fields.length === 0) continue;
      desired.push({
        fields: idx.fields,
        unique: !!idx.unique,
        name: idx.name
      });
    }

    // Uniques desde atributos
    const attributes = model.rawAttributes || model.tableAttributes || {};
    for (const [attrName, attrDef] of Object.entries(attributes)) {
      if (attrDef && attrDef.unique) {
        let name = typeof attrDef.unique === 'object' && attrDef.unique.name
          ? attrDef.unique.name
          : typeof attrDef.unique === 'string'
            ? attrDef.unique
            : null;

        if (!name) {
          name = buildDeterministicName(tableName, [attrName], true);
        }

        desired.push({
          fields: [attrName],
          unique: true,
          name
        });
      }
    }

    if (desired.length === 0) continue;

    let existing = [];
    try {
      existing = await queryInterface.showIndex(tableName);
    } catch {
      existing = [];
    }

    for (const idx of desired) {
      const name = idx.name || buildDeterministicName(tableName, idx.fields, idx.unique);
      const alreadyExists = existing.some(ex => areSameIndex(ex, idx.fields, idx.unique));
      if (alreadyExists) continue;

      await queryInterface.addIndex(tableName, idx.fields, {
        name,
        unique: !!idx.unique
      });
    }
  }
}

/**
 * Elimina índices duplicados detectando por firma (mismas columnas + unicidad)
 * Mantiene un índice por grupo de duplicados, eliminando los demás
 */
async function dropDuplicateIndexes(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const models = sequelize.models;

  function signatureOfIndex(idx) {
    const cols = (idx.columns || idx.column_names || idx.fields || idx.attributes || [])
      .map(c => String(c)).sort();
    const isUnique = !!(idx.unique || idx.indisunique || idx.non_unique === 0);
    return JSON.stringify({ cols, isUnique });
  }

  const isSystemOrPkOrFk = (idx) => {
    const name = String(idx.name || '').toLowerCase();
    if (name.includes('pk') || name.includes('pkey') || name.includes('primary')) return true;
    if (name.includes('fk') || name.includes('fkey') || name.includes('foreign')) return true;
    if (name.startsWith('sqlite_autoindex')) return true;
    return false;
  };

  for (const modelName of Object.keys(models)) {
    const model = models[modelName];
    const tableName = model.getTableName();
    if (!tableName) continue;

    let existing = [];
    try {
      existing = await queryInterface.showIndex(tableName);
    } catch {
      existing = [];
    }
    if (!Array.isArray(existing) || existing.length === 0) continue;

    const groups = new Map();
    for (const idx of existing) {
      if (!idx?.name) continue;
      if (isSystemOrPkOrFk(idx)) continue;
      const sig = signatureOfIndex(idx);
      if (!groups.has(sig)) groups.set(sig, []);
      groups.get(sig).push(idx);
    }

    for (const [, list] of groups.entries()) {
      if (list.length <= 1) continue;

      list.sort((a, b) => String(a.name).length - String(b.name).length);
      const dropThese = list.slice(1);

      for (const idx of dropThese) {
        try {
          await queryInterface.removeIndex(tableName, idx.name);
          console.log(`Eliminado índice duplicado: ${idx.name} en tabla ${tableName}`);
        } catch {
          // por ahora ignora errores de eliminación no críticos ya que no se vio relevante
        }
      }
    }
  }
}

module.exports = {
  ensureIndexesSmart,
  dropDuplicateIndexes
};
