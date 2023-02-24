"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateMeta = void 0;
function paginateMeta(total, page, limit) {
    //parse to number
    total = Number(total);
    page = Number(page);
    limit = Number(limit);
    //logic
    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;
    return {
        count: total,
        currentPage: page,
        nextPage: nextPage,
        prevPage: prevPage,
        lastPage: lastPage,
    };
}
exports.paginateMeta = paginateMeta;
//# sourceMappingURL=paginateMeta.js.map