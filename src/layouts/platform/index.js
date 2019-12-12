import { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { Layout } from 'antd';
import styles from './index.less';
//import Logo from './logo';
import FooterView from './Footer';
import ContentHeader from './header';
const { Header, Content } = Layout;

class Platform extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            // 系统主题
            theme: 'light',
        };
    };

    componentDidMount() {
        // 判断是否登录
        const isLogin = sessionStorage.getItem('isLogin');
        if (isLogin === 'false') {
            router.push('/login?status=1');
            return;
        }
    }
    // componentDidUpdate(prevProps) {
    //     if (this.props.location !== prevProps.location) {
    //         window.scrollTo(0, 0);
    //     }
    // }

    componentWillUnmount() {

    }

    handleSetting = (param) => {
        const { dispatch } = this.props;
        const { key, state } = param;
        if (key === 'logout') {
            dispatch({
                type: "global/logout",
                payload: {
                    ...state,
                },
            });
        }
    }
    

    render() {
        return (
            <Layout className={styles.wrap}>
                <Layout className={styles.container}>
                    <Header style={{ background: '#fff', padding: 0 }} className={styles.contentHeader}>
                        <div></div>
                        <ContentHeader handleSetting={this.handleSetting}/>
                    </Header>
                    <Content
                        className={styles.content}
                        style={{
                            margin: 16,
                            padding: 24,
                            background: '#fff',
                            minHeight: 280,
                        }}
                    >
                        {this.props.children}
              </Content>
                <FooterView />
                </Layout>
            </Layout>
        );
    }
}

export default connect(({ global }) => {
    return {
        ...global
    };
})(Platform);