const { BencodedValueTypes, getBencodedValueType } = require('../Utility/util');
const Stack = require('../Utility/Stack');
class Decoder {

    static decode(value) {
        const bencodedValueType = getBencodedValueType(value);
        let decodedValue;
        switch(bencodedValueType) {
            case BencodedValueTypes.STRING:
                decodedValue = JSON.stringify(this.decodeBencodedString(value));
                break;
            case BencodedValueTypes.NUMBER:
                decodedValue = this.decodeBencodedInteger(value);
                break;
            case BencodedValueTypes.LIST:
                decodedValue = JSON.stringify(this.decodeBencodedList(value))
                                    .replace(/'/g, '\"');
                break;
            case BencodedValueTypes.DICTIONARY:
                decodedValue = JSON.stringify(this.decodeBencodedDictionary(value));
                break;
            default:
                throw new Error("Unsupported value type");
        }
        return decodedValue;
    }

    static decodeBencodedString(string) {
        const firstColonIndex = string.indexOf(":");
        if (firstColonIndex === -1) {
            throw new Error("Invalid encoded value");
        }
        return string.substring(firstColonIndex + 1);
    }

    static decodeBencodedInteger(integer) {
        const endIndex = integer.indexOf("e");
        if (endIndex === -1) {
            throw new Error("Invalid encoded value");
        }
        return parseInt(integer.substr(1, endIndex - 1));
    }

    static decodeBencodedList(list) {
        let decodedList = [];
        let listContent = list.substring(1, list.length - 1);
        while (listContent.length > 0) {
            let valueType = listContent[0];
            let value;
            if (valueType === "i") {
                [value, listContent] = Decoder.#extractEncodedInteger(listContent);
                decodedList.push(Decoder.decodeBencodedInteger(value));
            } else if (!isNaN(valueType)) {
                [value, listContent] = Decoder.#extractEncodedString(listContent);
                decodedList.push(Decoder.decodeBencodedString(value));
            } else if (valueType === "l") {
                [value, listContent] = Decoder.#extractEncodedList(listContent);
                decodedList.push(Decoder.decodeBencodedList(value));
            } else {
                throw new Error("Unsupported value type");
            }
        }
        return decodedList;
    }

    static decodeBencodedDictionary(dictionary) {
        let decodedDictionary = {};
        let dictionaryContent = dictionary.substring(1, dictionary.length - 1);
        while (dictionaryContent.length > 0) {
            let keyType = dictionaryContent[0];
            let key;
            if (keyType === "i") {
                [key, dictionaryContent] = Decoder.#extractEncodedInteger(dictionaryContent);
                key = Decoder.decodeBencodedInteger(key);
            } else if (!isNaN(keyType)) {
                [key, dictionaryContent] = Decoder.#extractEncodedString(dictionaryContent);
                key = Decoder.decodeBencodedString(key);
            } else {
                throw new Error("Unsupported value type");
            }
            let valueType = dictionaryContent[0];
            let value;
            if (valueType === "i") {
                [value, dictionaryContent] = Decoder.#extractEncodedInteger(dictionaryContent);
                value = Decoder.decodeBencodedInteger(value);
            } else if (!isNaN(valueType)) {
                [value, dictionaryContent] = Decoder.#extractEncodedString(dictionaryContent);
                value = Decoder.decodeBencodedString(value);
            } else if (valueType === "l") {
                [value, dictionaryContent] = Decoder.#extractEncodedList(dictionaryContent);
                value = Decoder.decodeBencodedList(value);
            } else if (valueType === "d") {
                [value, dictionaryContent] = Decoder.#extractEncodedDictionary(dictionaryContent);
                value = Decoder.decodeBencodedDictionary(value);
            } else {
                throw new Error("Unsupported value type");
            }
            decodedDictionary[key] = value;
        }
        return decodedDictionary;
    }

    static #extractEncodedInteger(content) {
        let endIndex = content.indexOf("e");
        let integer = content.substring(0, endIndex + 1);
        content = content.substring(endIndex + 1);
        return [integer, content];
    }

    static #extractEncodedString(content) {
        let colonIndex = content.indexOf(":");
        let length = parseInt(content.substring(0, colonIndex));
        let string = content.substring(0, colonIndex + length + 1);
        content = content.substring(colonIndex + length + 1);
        return [string, content];
    }

    static #extractEncodedList(content) {
        let endIndex = Decoder.#findEndIndexOfListOrDict(content, "l");
        if (endIndex === -1) {
            throw new Error("Invalid encoded value");
        }
        let list = content.substring(0, endIndex + 1);
        content = content.substring(endIndex + 1);
        return [list, content];
    }

    static #extractEncodedDictionary(content) {
        let endIndex = Decoder.#findEndIndexOfListOrDict(content, "d");
        if (endIndex === -1) {
            throw new Error("Invalid encoded value");
        }
        let dictionary = content.substring(0, endIndex + 1);
        content = content.substring(endIndex + 1);
        return [dictionary, content];
    }

    static #findEndIndexOfListOrDict(content, character) {
        let i = 0;
        let stack = new Stack();
        while(i < content.length) {
            let ch = content[i];
            if (ch === "e") {
                if(stack.isEmpty()) {
                    throw new Error("Invalid encoded value");
                }
                let ch = stack.pop();
                if(ch === character && stack.isEmpty()) {
                    return i;
                }
            } else if (!isNaN(ch) && stack.peek() !== "i") {
                let colonIndex = content.indexOf(":", i);
                let length = parseInt(content.substring(i, colonIndex));
                i = colonIndex + length;
            } else if (isNaN(ch)) {
                /* this case is executed if (ch === "d" || ch === "l" || ch === "i") */
                stack.push(ch);
            }
            i++;
        }
        return -1;
    }
}

module.exports = Decoder;