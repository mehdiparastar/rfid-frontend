export const powerPercentToDbm = (percent: number) => {
    switch (percent) {
        case 100: return 26
        case 96: return 25
        case 92: return 24
        case 88: return 23
        case 85: return 22
        case 81: return 21
        case 77: return 20
        case 73: return 19
        case 69: return 18
        case 65: return 17
        case 62: return 16
        case 58: return 15
        case 54: return 14
        case 50: return 13
        case 47: return 12
        case 43: return 11
        case 39: return 10
        case 35: return 9
        case 31: return 8
        case 27: return 7
        case 24: return 6
        case 20: return 5
        case 16: return 4
        case 12: return 3
        case 8: return 2
        case 5: return 1
        default:
            return undefined;
    }
}

export const powerDbmToPercent = (dbm: number) => {
    switch (dbm) {
        case 26: return 100
        case 25: return 96
        case 24: return 92
        case 23: return 88
        case 22: return 85
        case 21: return 81
        case 20: return 77
        case 19: return 73
        case 18: return 69
        case 17: return 65
        case 16: return 62
        case 15: return 58
        case 14: return 54
        case 13: return 50
        case 12: return 47
        case 11: return 43
        case 10: return 39
        case 9: return 35
        case 8: return 31
        case 7: return 27
        case 6: return 24
        case 5: return 20
        case 4: return 16
        case 3: return 12
        case 2: return 8
        case 1: return 5
        default:
            return undefined;
    }
}