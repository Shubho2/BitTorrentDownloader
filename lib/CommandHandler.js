const decoder = require('./Decoder');
const { BencodedValueTypes, getBencodedValueType } = require('./util');

class CommandHandler {

    static decode(value) {
        const bencodedValueType = getBencodedValueType(value);
        switch(bencodedValueType) {
            case BencodedValueTypes.STRING:
                console.log(decoder.decodeBencodedString(value));
                break;
            case BencodedValueTypes.NUMBER:
                console.log(decoder.decodeBencodedInteger(value));
                break;
            default:
                throw new Error("Unsupported value type");
        }
    }
}

module.exports = CommandHandler;