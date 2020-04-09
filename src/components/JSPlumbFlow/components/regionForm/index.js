import React, { Component } from 'react';
import { getClientHeight, getRegionWidth } from '@utils';
import { Form, Input } from 'antd';

class Index extends Component {
  state = {
    isHeightError: false,
    isWidthError: false,
  };
  componentDidMount() {
    const regionConfig = window.localStorage.getItem('regionConfig');
    if (regionConfig) {
      this.setFiledsVals(regionConfig);
    } else {
      this.setInitVals();
    }
  }

  // 设置浏览器缓存值
  setFiledsVals = regionConfig => {
    const { regionWidth, regionHeight } = JSON.parse(regionConfig);

    this.props.form.setFieldsValue({
      regionWidth,
      regionHeight,
    });
  };
  // blur 高度验证
  onVerificateH = e => {
    const regionHeight = getClientHeight() - 47;
    let val = parseInt(e.target.value);
    const isError = val < regionHeight || val > 5000;
    this.setState({
      isHeightError: isError,
    });
  };
  onHeightChange = () => {
    const { isHeightError } = this.state;
    if (isHeightError) {
      this.setState({
        isHeightError: false,
      });
    }
  };

  // blur 宽度验证
  onVerificateW = e => {
    const regionWidth = getRegionWidth();
    let val = parseInt(e.target.value);
    const isError = val < regionWidth || val > 5000;
    this.setState({
      isWidthError: isError,
    });
  };
  onWidthChange = () => {
    const { isWidthError } = this.state;
    if (isWidthError) {
      this.setState({
        isWidthError: false,
      });
    }
  };

  // 设置初始值
  setInitVals = () => {
    const { form } = this.props;
    // 获取计算好的区域宽度
    const regionWidth = getRegionWidth();
    // 减去header高度
    const regionHeight = getClientHeight() - 47;
    console.log(regionWidth);
    console.log(regionHeight);

    form.setFieldsValue({
      regionWidth,
      regionHeight,
    });
  };

  render() {
    const { form } = this.props;
    const { isHeightError, isWidthError } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 16 },
    };
    const errorH = isHeightError
      ? {
          validateStatus: 'error',
          help: '小于浏览器默认高度或超出最大高度5000',
        }
      : {};
    const errorW = isWidthError
      ? {
          validateStatus: 'error',
          help: '小于浏览器默认宽度或超出最大宽度5000',
        }
      : {};
    return (
      <Form layout="horizontal">
        <Form.Item label="宽度" {...formItemLayout} {...errorW}>
          {getFieldDecorator('regionWidth', {
            rules: [
              { required: true, message: '请输入宽度' },
              {
                required: false,
                pattern: new RegExp(/^[1-9]\d*$/, 'g'),
                message: '请输入数字',
              },
            ],
          })(<Input onBlur={this.onVerificateW} onChange={this.onWidthChange} />)}
        </Form.Item>
        <Form.Item label="高度" {...formItemLayout} {...errorH}>
          {getFieldDecorator('regionHeight', {
            rules: [
              { required: true, message: '请输入高度' },
              {
                required: false,
                pattern: new RegExp(/^[1-9]\d*$/, 'g'),
                message: '请输入数字',
              },
            ],
          })(<Input onBlur={this.onVerificateH} onChange={this.onHeightChange} />)}
        </Form.Item>
        <div style={{ padding: '0 16px' }}>
          <span>默认宽度：{getRegionWidth()}</span>
          <span style={{ marginLeft: 20 }}>默认高度：{getClientHeight() - 47}</span>
        </div>
      </Form>
    );
  }
}
export default Form.create({ name: 'form_in_modal' })(Index);
