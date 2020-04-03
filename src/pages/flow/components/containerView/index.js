import React, { Component } from 'react';
import JsPlumbFlow from '@components/JsPlumbFlow';
import styles from './index.less';

export default class index extends Component {
  render() {
    return (
      <div className={styles.container}>
        <div style={{ flex: '1', overflow: 'auto' }}>
          <JsPlumbFlow />
        </div>
      </div>
    );
  }
}
