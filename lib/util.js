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
    } else if(value[0] == 'i') {
        return BencodedValueTypes.NUMBER;
    }
}

module.exports = {
    BencodedValueTypes,
    getBencodedValueType
};