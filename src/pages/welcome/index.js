import React, { Component } from 'react';
import styles from './index.less';

export default class Welcome extends Component {
  render() {
    return (
      <div className={styles.welcome}>
        <h2>欢迎使用业务模板</h2>
      </div>
    )
  }
}
