
import React from 'react';
import { Layout } from 'antd';
import styles from './index.less';

const { Footer } = Layout;
const FooterView = () => (
  <Footer style={{padding:0,paddingBottom: 10}} className={styles.footer}>
    <div style={{color: '#333', opacity: 0.6}}>云知声智慧病房业务模板</div>    
  </Footer>
);
export default FooterView;
