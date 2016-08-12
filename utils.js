var Utils = {
    formatPokeNumber : function(num) {
        if (num < 10)
            return "00" + num.toString();
        else {
            if (num < 100)
                return "0" + num.toString();
            else
                return num.toString();
        }
    }
};

module.exports = Utils;