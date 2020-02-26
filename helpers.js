module.exports = {
    errorHandler(err) {
        console.log(err);
        throw new Error(err.message || 'unknown error')
    }
}