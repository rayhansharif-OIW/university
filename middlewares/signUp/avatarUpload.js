const { uploader } = require('../../utilities/singleUploader');

function upload(n = 1) {
    return function avatarUpload(req, res, next) {
        if (req.file) {
            console.log('from 1st');
            const upload = uploader(['image/jpeg', 'image/jpg', 'image/png', 'image/heif', 'image/heic'], 10000000, 'Only images allowed!', n);
            upload.any()(req, res, async (err) => {
                if (err) {
                    res.status(500).json({
                        errors: {
                            avater: {
                                msg: err.message,
                            },
                        },
                    });
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    };
}

module.exports = {
    upload,
};
