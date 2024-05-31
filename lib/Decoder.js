
class Decoder {

    static decodeBencodedString(string) {
        const firstColonIndex = string.indexOf(":");
        if (firstColonIndex === -1) {
            throw new Error("Invalid encoded value");
        }
        return JSON.stringify(string.substr(firstColonIndex + 1));
    }

    static decodeBencodedInteger(integer) {
        const endIndex = integer.indexOf("e");
        if (endIndex === -1) {
            throw new Error("Invalid encoded value");
        }
        return integer.substr(1, endIndex - 1);
    }
}

module.exports = Decoder;