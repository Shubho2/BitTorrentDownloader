const BencodedValueTypes = Object.freeze({
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    LIST: 'LIST',
    DICTIONARY: 'DICTIONARY'
});

function getBencodedValueType(value) {
    // Check if the first character is a digit
    if(!isNaN(value[0])) {
        return BencodedValueTypes.STRING;
    }
    // Check if the first character is an integer
    else if(value[0] == 'i') {
        return BencodedValueTypes.NUMBER;
    }
    // Check if the first character is a list
    else if(value[0] == 'l') {
        return BencodedValueTypes.LIST;
    }
    // Check if the first character is a dictionary
    else if(value[0] == 'd') {
        return BencodedValueTypes.DICTIONARY;
    }
    else {
        throw new Error("Unsupported value type");
    }
}

module.exports = {
    BencodedValueTypes,
    getBencodedValueType
};