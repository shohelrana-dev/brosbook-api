"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectAllColumns = void 0;
function selectAllColumns(repository) {
    return repository.metadata.columns.map(col => col.propertyName);
}
exports.selectAllColumns = selectAllColumns;
//# sourceMappingURL=selectAllColumns.js.map