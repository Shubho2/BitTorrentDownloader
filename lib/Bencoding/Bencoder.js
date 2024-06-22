
module.exports = class Bencoder {

    /**
     * 
     * @param {string | number | object} value The value to encode
     * @returns {string}  The encoded value
     */
    static encode(value) {
        let encodedValue = "";
        switch (typeof value) {
            case "string":
                encodedValue = Bencoder.encodeString(value);
                break;
            case "number":
                encodedValue = Bencoder.encodeInteger(value);
                break;
            case "object":
                encodedValue = Array.isArray(value) ? Bencoder.encodeList(value) 
                                    : Bencoder.encodeDictionary(value);
                break;
            default:
                throw new Error("Invalid value to encode");
        }
        return encodedValue;
    }

    static encodeString(str) {
        return str.length + ":" + str;
    }

    static encodeInteger(integer) {
        return "i" + integer + "e";
    }

    static encodeList(list) {
        let encodedList = "l";
        for (let item of list) {
            encodedList += Bencoder.encode(item);
        }
        return encodedList + "e";
    }


    static encodeDictionary(dictionary) {
        let sortedKeysArray = Object.keys(dictionary).sort();
        let encodedDictionary = "d";
        for (let key of sortedKeysArray) {
            encodedDictionary += Bencoder.encodeString(key);
            encodedDictionary += Bencoder.encode(dictionary[key]);
        }
        return encodedDictionary + "e";
    }
}