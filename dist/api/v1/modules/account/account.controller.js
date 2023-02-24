"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AccountController {
    constructor(accountService) {
        this.accountService = accountService;
        this.updateProfile = async (req, res, next) => {
            try {
                const user = await this.accountService.updateProfile(req.body, req.auth);
                res.json(user);
            }
            catch (err) {
                next(err);
            }
        };
        this.changeUsername = async (req, res, next) => {
            try {
                const user = await this.accountService.changeUsername(req.body, req.auth);
                res.json(user);
            }
            catch (err) {
                next(err);
            }
        };
        this.changePassword = async (req, res, next) => {
            try {
                const user = await this.accountService.changePassword(req.body, req.auth);
                res.json(user);
            }
            catch (err) {
                next(err);
            }
        };
    }
}
exports.default = AccountController;
//# sourceMappingURL=account.controller.js.map