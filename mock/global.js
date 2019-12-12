
module.exports = {
    [`POST /getSysInfo`](req, res) {
        res.status(200).json({
            data: {
                userInfo: {
                    userName: 'admin',
                },
                message: {
                    news: 'news'
                },
            },
            status: 0
        });
    },
    [`GET /logout`](req, res) {
        res.status(200).json({
            data: {
                message: "退出登录成功！"
            },
            status: 0
        });
    },
};