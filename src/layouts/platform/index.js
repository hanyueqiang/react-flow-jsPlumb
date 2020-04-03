import { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { Layout } from 'antd';
import styles from './index.less';
//import Logo from './logo';
const { Content } = Layout;

class Platform extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // 系统主题
      theme: 'light',
    };
  }

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

  componentWillUnmount() {}

  handleSetting = param => {
    const { dispatch } = this.props;
    const { key, state } = param;
    if (key === 'logout') {
      dispatch({
        type: 'global/logout',
        payload: {
          ...state,
        },
      });
    }
  };

  render() {
    return (
      <Layout className={styles.wrap}>
        <Layout className={styles.container}>
          <Content
            className={styles.content}
            style={{
              background: '#',
              minHeight: 280,
            }}
          >
            {this.props.children}
          </Content>
        </Layout>
      </Layout>
    );
  }
}

export default connect(({ global }) => {
  return {
    ...global,
  };
})(Platform);
