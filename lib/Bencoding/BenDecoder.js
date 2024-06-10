const { BencodedValueTypes, getBencodedValueType } = require('./BencodedValueTypes');
class BenDecoder {

    /**
     * 
     * @param {string} value Bencoded string to decode 
     * @returns an array containing the decoded value and the rest of the string
     *          (which is nil if the string is fully decoded)
     */
    static decode(value) {
        const bencodedValueType = getBencodedValueType(value);
        let decodeResult;
        switch(bencodedValueType) {
            case BencodedValueTypes.STRING:
                decodeResult = this.decodeBencodedString(value);
                break;
            case BencodedValueTypes.NUMBER:
                decodeResult = this.decodeBencodedInteger(value);
                break;
            case BencodedValueTypes.LIST:
                decodeResult = this.decodeBencodedList(value);
                break;
            case BencodedValueTypes.DICTIONARY:
                decodeResult = this.decodeBencodedDictionary(value);
                break;
            default:
                throw new Error("Unsupported value type");
        }
        return decodeResult;
    }

    static decodeBencodedString(string) {
        const firstColonIndex = string.indexOf(":");
        if (firstColonIndex === -1) {
            throw new Error("Invalid encoded value");
        }
        let length = parseInt(string.slice(0, firstColonIndex));
        return [string.substring(firstColonIndex + 1, firstColonIndex + length + 1), 
                string.substring(firstColonIndex + length + 1)];
    }

    static decodeBencodedInteger(integer) {
        const endIndex = integer.indexOf("e");
        if (endIndex === -1) {
            throw new Error("Invalid encoded value");
        }

        return [parseInt(integer.substring(1, endIndex)), 
            integer.substring(endIndex + 1)];
    }

    static decodeBencodedList(list) {
        let decodedList = [];
        let rest = list.slice(1);
        let v;
        while (rest && rest[0] !== "e") {
            [v, rest] = BenDecoder.decode(rest);
            decodedList.push(v);
        }

        return [decodedList, rest.substring(1)];
    }

    static decodeBencodedDictionary(dictionary) {
        let decodedDictionary = {};
        let rest = dictionary.slice(1);
        let key, value;
        while (rest && rest[0] !== "e") {
            [key, rest] = BenDecoder.decode(rest);
            [value, rest] = BenDecoder.decode(rest);
            decodedDictionary[key] = value;
        }

        return [decodedDictionary, rest.substring(1)];
    }
}

module.exports = BenDecoder;