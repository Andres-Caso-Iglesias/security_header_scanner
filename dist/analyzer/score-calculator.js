"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreCalculator = void 0;
const common_1 = require("@nestjs/common");
let ScoreCalculator = class ScoreCalculator {
    MAX_POSSIBLE_SCORE = 165;
    calculate(headers) {
        const totalWeightedScore = headers.reduce((sum, header) => sum + header.weight * header.grade, 0);
        const score = Math.round((totalWeightedScore / this.MAX_POSSIBLE_SCORE) * 100);
        const grade = this.getGrade(score);
        return { score, grade };
    }
    getGrade(score) {
        if (score >= 90)
            return 'A';
        if (score >= 80)
            return 'B';
        if (score >= 70)
            return 'C';
        if (score >= 60)
            return 'D';
        if (score >= 50)
            return 'E';
        return 'F';
    }
};
exports.ScoreCalculator = ScoreCalculator;
exports.ScoreCalculator = ScoreCalculator = __decorate([
    (0, common_1.Injectable)()
], ScoreCalculator);
//# sourceMappingURL=score-calculator.js.map