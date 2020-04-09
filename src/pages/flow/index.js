import React, { Component } from 'react';
import HearderView from './components/hearderView';
// import ContainerView from './components/containerView';
import JsPlumbFlow from '@components/JsPlumbFlow';
import styles from './index.less';

class Index extends Component {
  render() {
    return (
      <div className={styles.flow}>
        <HearderView />
        <JsPlumbFlow />
      </div>
    );
  }
}
export default Index;
