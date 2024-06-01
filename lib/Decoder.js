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
                let endIndex = listContent.indexOf("e");
                value = listContent.substring(0, endIndex + 1);
                listContent = listContent.substring(endIndex + 1);
                decodedList.push(Decoder.decodeBencodedInteger(value));
            } else if (!isNaN(valueType)) {
                let colonIndex = listContent.indexOf(":");
                let length = parseInt(listContent.substring(0, colonIndex));
                value = listContent.substring(0, colonIndex + length + 1);
                listContent = listContent.substring(colonIndex + length + 1);
                decodedList.push(Decoder.decodeBencodedString(value));
            } else if (valueType === "l") {
                let endIndex = Decoder.#findEndIndexOfList(listContent);
                if (endIndex === -1) {
                    throw new Error("Invalid encoded value");
                }
                value = listContent.substring(0, endIndex + 1);
                listContent = listContent.substring(endIndex + 1);
                decodedList.push(Decoder.decodeBencodedList(value));
            } else {
                throw new Error("Unsupported value type");
            }
        }
        return decodedList;
    }

    static #findEndIndexOfList(listContent) {
        let i = 0;
        let stack = new Stack();
        while(i < listContent.length) {
            let ch = listContent[i];
            if (ch === "l" || ch === "i") {
                stack.push(ch);
            } else if (ch === "e") {
                let ch = stack.pop();
                if(ch === "l" && stack.isEmpty()) {
                    return i;
                }
            } else if (!isNaN(ch) && stack.peek() !== "i") {
                let colonIndex = listContent.indexOf(":", i);
                let length = parseInt(listContent.substring(i, colonIndex));
                i = colonIndex + length;
            }
            i++;
        }
        return -1;
    }
}

module.exports = Decoder;