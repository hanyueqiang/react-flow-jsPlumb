import React, { Component } from 'react';
import { Form, Select, Input, Modal, Button, message } from 'antd';
import { DndProvider } from 'react-dnd';
import Backend from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import DragComponent from '../dragComponent';
import 'jsplumb';

// import './data/data2';
localStorage.setItem('visoData', '{"nodeData":[],"connectionData":[]}');
// import './index.css';
// import 'antd/dist/antd.css';

const FormItem = Form.Item;

const jsPlumb = window.jsPlumb;
const containerId = 'diagramContainer';
const containerSelector = '#' + containerId;

// 是否允许改变流程图的布局（包括大小、连线、节点删除等）
const canChangeLayout = true;

// 很多连接线都是相同设置的情况下，可以将配置抽离出来，作为一个单独的变量，作为connect的第二个参数传入。
// 实际上connect的第二个参数会和第一个参数merge，作为一个整体。
const commonConfig = {
  // 是否可以拖动（作为连线起点）
  isSource: canChangeLayout,
  // 是否可以放置（连线终点）
  isTarget: canChangeLayout,
  // 设置连接点最多可以连接几条线
  // -1不限制，默认限制一条线
  maxConnections: -1,
  // 设置锚点位置，按照[target, source]的顺序进行设置
  // 可以有 Bottom Top Right Left四种方位
  // 还可以是BottomLeft BottomRight BottomCenter TopLeft TopRight TopCenter LeftMiddle RightMiddle的组合
  // 默认值 ['Bottom', 'Bottom']
  // anchor: ['Bottom', 'Bottom'],
  // 端点类型，形状（区分大小写），Rectangle-正方形 Dot-圆形 Blank-空
  endpoint: [
    canChangeLayout ? 'Dot' : 'Blank',
    {
      radius: 4,
    },
  ],
  // 设置端点的样式
  endpointStyle: {
    fill: '#456', // 填充颜色
    outlineStroke: 'blank', // 边框颜色
    outlineWidth: 0, // 边框宽度
  },
  // 设置连接线的样式 Bezier-贝瑟尔曲线 Flowchart-流程图 StateMachine-弧线 Straight-直线
  connector: ['Flowchart'],
  // 设置连接线的样式
  connectorStyle: {
    stroke: '#456', // 实线颜色
    strokeWidth: 3, // 实线宽度
    outlineStroke: 'blank', // 边框颜色
    outlineWidth: 2, // 边框宽度
  },
  // 设置连接线悬浮样式
  connectorHoverStyle: {
    stroke: 'lightblue', // 实线颜色
  },
  // 设置连接线的箭头
  // 可以设置箭头的长宽以及箭头的位置，location 0.5表示箭头位于中间，location 1表示箭头设置在连接线末端。 一根连接线是可以添加多个箭头的。
  connectorOverlays: [
    [
      'Arrow',
      {
        width: 10,
        length: 10,
        location: 1,
      },
    ],
  ],
};

// 不同节点类型的class类名
const TypeClassName = {
  startEvent: 'viso-start',
  endEvent: 'viso-end',
  exclusiveGateway: 'viso-gateway-exclusive',
  parallelGateway: 'viso-gateway-parallel',
  userTask: 'viso-task',
  type1: 'viso-item-type1',
  type2: 'viso-item-type2',
  type3: 'viso-item-type3',
};

// 分支条件存储
const ConditionCache = {};

class Index extends Component {
  // 初始化页面常量、绑定事件方法
  constructor(props) {
    super(props);

    // 组件数据
    this.state = {
      // 连线编辑保存信息
      labelOverlay: null,
      editModalSourceId: '',
      eiditModalTargetid: '',
      editModalCondition: '',
      editModalLabelText: '',
      // 流程节点
      nodeList: null,
      // 显示编辑浮层
      showEditModal: false,
      // 右侧展示属性
      nodeTypesSource: {},
      //右侧添加属性btn
      typeBtnList: [],
      // 表单配置弹窗
      formVisible: false,
      // 右侧属性节点描述
      nodeDescription: '',
      // 结果弹窗 临时使用
      isShowResult: false,
      // 输出结果json
      showResult: '',
    };
  }

  // DOM挂载完成时调用
  componentDidMount() {
    this.initFlow();
  }

  // 初始化流程图
  initFlow() {
    jsPlumb.ready(() => {
      // 设置绘图容器
      jsPlumb.setContainer(containerId);

      // 可以使用importDefaults，来重写某些默认设置
      jsPlumb.importDefaults({
        ConnectionsDetachable: true, // 一般来说拖动创建的连接，可以再次拖动，让连接断开。如果不想触发这种行为，可以设置。
      });

      // 绑定加载数据的操作数据
      // this.bindLoadData();

      // 绑定保存数据的操作数据
      this.bindSaveData();

      // 绑定清除数据的操作数据
      this.bindClearData();

      // 绑定节点内容编辑
      this.bindEditNodeName();

      // 加载数据并绘制流程图
      this.loadDataAndPaint();

      // 绑定点击展示数据详情-h
      this.bindShowData();

      // 允许改变流程图的布局
      if (canChangeLayout) {
        // 绑定删除连接线的操作处理
        this.bindDeleteConnection();

        // 绑定删除节点操作
        this.bindRemoveNode();

        // 绑定连接线添加label文本
        this.bindConnectionAddLabel();
      }
    });
  }

  // 设置默认表现
  setDefault(id) {
    canChangeLayout && this.setDraggable(id);
    this.addEndpoint(id);
  }

  // 设置指定节点可拖动
  setDraggable(id) {
    jsPlumb.draggable(id, {
      containment: 'parent', // 限制节点的拖动区域
      grid: [10, 10], // 设置网格
    });
  }

  // 给指定节点添加端点
  addEndpoint(id) {
    jsPlumb.addEndpoint(id, { anchors: 'Left', uuid: `${id}-anchor-left-middle` }, commonConfig);
    jsPlumb.addEndpoint(id, { anchors: 'Right', uuid: `${id}-anchor-right-middle` }, commonConfig);
    jsPlumb.addEndpoint(id, { anchors: 'Top', uuid: `${id}-anchor-center-top` }, commonConfig);
    jsPlumb.addEndpoint(
      id,
      { anchors: 'Bottom', uuid: `${id}-anchor-center-bottom` },
      commonConfig,
    );
  }

  // 设置连线
  setConnection(info) {
    jsPlumb.connect({
      uuids: [this.getAnchorID(info.source), this.getAnchorID(info.target)],
      overlays: [
        [
          'Label',
          this.getLabelSetInfo(info.label || '', info.source.elementId, info.target.elementId),
        ],
      ],
    });
  }

  // 获取端点id
  getAnchorID(anchorInfo) {
    const nodeInfo = this.getNodeInfo(document.getElementById(anchorInfo.elementId));
    const posX = (anchorInfo.x - nodeInfo.x) / nodeInfo.width;
    const posY = (anchorInfo.y - nodeInfo.y) / nodeInfo.height;
    let posXName = 'center';
    let posYName = 'middle';

    if (posX === 0) {
      posXName = 'left';
    } else if (posX > 0.6) {
      posXName = 'right';
    }

    if (posY === 0) {
      posYName = 'top';
    } else if (posY > 0.6) {
      posYName = 'bottom';
    }

    return `${anchorInfo.elementId}-anchor-${posXName}-${posYName}`;
  }

  // 清除画布内容
  clearCont() {
    // 删除所有连接线
    jsPlumb.deleteEveryConnection();

    // 删除所有端点
    jsPlumb.deleteEveryEndpoint();

    // 删除所有节点
    // document.querySelector(containerSelector).innerHTML = ''
    this.setState({ nodeList: null });
  }

  // 获取节点数据
  getNodeData() {
    const visoEles = document.querySelectorAll(containerSelector + ' .viso-item');
    const nodeData = [];
    for (let i = 0, len = visoEles.length; i < len; i++) {
      const nodeInfo = this.getNodeInfo(visoEles[i]);

      if (!nodeInfo.id) {
        message.error('流程图节点必须包含id');
        return;
        // throw new Error('流程图节点必须包含id');
      }

      if (!nodeInfo.name) {
        message.error('流程图节点必须包含name');
        return;
        // throw new Error('流程图节点必须包含name');
      }

      nodeData.push({
        id: nodeInfo.id,
        name: nodeInfo.name,
        type: nodeInfo.type,
        width: nodeInfo.width,
        height: nodeInfo.height,
        description: nodeInfo.description, // 节点描述
        x: nodeInfo.x,
        y: nodeInfo.y,
      });
    }

    return nodeData;
  }

  // 获取节点相关信息
  getNodeInfo(ele) {
    const id = ele.getAttribute('id');
    const eleName = ele.querySelector('.viso-name');
    const eleSelect = ele.querySelector('.ant-select-selection-selected-value');
    const eleRead = eleName || eleSelect;
    const name = eleRead
      ? (eleRead.innerText || eleRead.textContent).replace(/^\s+|\s+$/g, '')
      : '';
    const currentStyle = ele.currentStyle || window.getComputedStyle(ele, null);
    return {
      id: id,
      name: name,
      type: ele.getAttribute('data-type'),
      description: ele.getAttribute('data-description'),
      width: parseInt(currentStyle.width, 10) || 80,
      height: parseInt(currentStyle.height, 10) || 80,
      x: parseInt(currentStyle.left, 10) || 0,
      y: parseInt(currentStyle.top, 10) || 0,
    };
  }

  // 获取连线数据
  getConnectionData() {
    const originalData = jsPlumb.getAllConnections();
    const connectionData = [];

    originalData.forEach(item => {
      const anchorSource = item.endpoints[0].anchor;
      const anchorTarget = item.endpoints[1].anchor;
      const anchorSourceInfo = {
        name: anchorSource.type,
        x: anchorSource.x,
        y: anchorSource.y,
      };
      const anchorTargetInfo = {
        name: anchorTarget.type,
        x: anchorTarget.x,
        y: anchorTarget.y,
      };
      const anchorSourcePosition = this.getAnchorPosition(anchorSource.elementId, anchorSourceInfo);
      const anchorTargetPosition = this.getAnchorPosition(anchorTarget.elementId, anchorTargetInfo);

      const overlays = item.getOverlays();
      let labelText = '';

      Object.keys(overlays).forEach(key => {
        if (overlays[key].type === 'Label') {
          labelText = overlays[key].labelText;
        }
      });

      const infoObj = {
        // 连线id
        id: item.id,
        // label文本
        label: labelText,
        // 源节点
        source: {
          elementId: anchorSource.elementId,
          x: anchorSourcePosition.x,
          y: anchorSourcePosition.y,
        },
        // 目标节点
        target: {
          elementId: anchorTarget.elementId,
          x: anchorTargetPosition.x,
          y: anchorTargetPosition.y,
        },
      };

      const condition = ConditionCache[anchorSource.elementId + ':' + anchorTarget.elementId];
      if (condition) {
        infoObj['conditionExpression'] = condition;
      }

      connectionData.push(infoObj);
    });

    return connectionData;
  }

  // 获取节点坐标信息
  getAnchorPosition(elementId, anchorInfo) {
    const nodeInfo = this.getNodeInfo(document.getElementById(elementId));

    return {
      x: nodeInfo.x + nodeInfo.width * anchorInfo.x,
      y: nodeInfo.y + nodeInfo.height * anchorInfo.y,
    };
  }

  // 获取设置Label文本的配置信息
  getLabelSetInfo(labelText, sourceId, targetId) {
    return {
      label: labelText || '',
      cssClass: 'jtk-overlay-label',
      location: 0.4,
      events: {
        click: labelOverlay => {
          this.setState({
            labelOverlay,
            editModalCondition: ConditionCache[`${sourceId}:${targetId}`],
            editModalSourceId: sourceId,
            eiditModalTargetid: targetId,
            editModalLabelText: labelOverlay.labelText,
            showEditModal: true,
          });
        },
      },
    };
  }

  // 加载数据并绘制流程图
  loadDataAndPaint() {
    const defData = { connectionData: [], nodeData: [] };
    const storageData = localStorage.getItem('visoData');
    const visoData = storageData ? JSON.parse(storageData) : defData;
    const nodeData = visoData.nodeData;
    const connectionData = visoData.connectionData;

    // 清除内容
    this.clearCont();

    // 添加节点
    const nodeList = nodeData.map(info => {
      let nodeHTML;
      let styleObj = {
        position: 'absolute',
        left: `${info.x}px`,
        top: `${info.y}px`,
      };
      if (info.width) {
        styleObj.width = `${info.width}px`;
        styleObj.height = `${info.height}px`;
      }
      if (info.type.toLocaleLowerCase().indexOf('task') >= 0) {
        nodeHTML = (
          <div
            key={info.id}
            id={info.id}
            data-id={info.id}
            data-description={info.description}
            className={`viso-item ${TypeClassName[info.type]}`}
            style={styleObj}
            data-type={info.type}
          >
            <Select defaultValue={info.name}>
              <Select.Option value="组长审批">组长审批</Select.Option>
              <Select.Option value="主管审批">主管审批</Select.Option>
              <Select.Option value="人事审批">人事审批</Select.Option>
              <Select.Option value="经理审批">经理审批</Select.Option>
            </Select>
            <span className="viso-close" style={{ display: canChangeLayout ? 'block' : 'none' }}>
              &times;
            </span>
          </div>
        );
      } else {
        nodeHTML = (
          <div
            key={info.id}
            id={info.id}
            data-id={info.id}
            data-description={info.description}
            className={`viso-item ${TypeClassName[info.type]}`}
            style={styleObj}
            data-type={info.type}
          >
            <span className="viso-name">{info.name}</span>
            <span className="viso-close" style={{ display: canChangeLayout ? 'block' : 'none' }}>
              &times;
            </span>
          </div>
        );
      }
      return nodeHTML;
    });

    this.setState(
      {
        nodeList,
      },
      () => {
        // 设置默认表现
        nodeData.forEach(info => {
          this.setDefault(info.id);
        });

        // 创建连线
        connectionData.forEach(info => {
          if (info.conditionExpression) {
            ConditionCache[info.source.elementId + ':' + info.target.elementId] =
              info.conditionExpression;
          }
          this.setConnection(info);
        });
      },
    );
  }

  // 拖拽左侧类型获取位置信息
  dragEndHandle = (name, type, dragOffset) => {
    const offsetX = dragOffset ? dragOffset.x : 0;
    const offsetY = dragOffset ? dragOffset.y : 0;
    // 150为左侧宽度
    let dragX = offsetX - 150;
    // 45为header高度
    let dragY = offsetY - 45;
    if (dragX < 0 || dragY < 0) {
      message.info('请拖拽至区域内！');
      return;
    }
    this.addNodeHandle(name, type, dragX, dragY);
  };

  //添加节点
  addNodeHandle = (name, type, dragX, dragY) => {
    const defData = { connectionData: [], nodeData: [] };
    const storageData = localStorage.getItem('visoData');
    const visoData = storageData ? JSON.parse(storageData) : defData;
    const nodeData = visoData.nodeData;
    let obj = {
      id: uuidv4(),
      name,
      type,
      width: 90,
      height: 32,
      x: dragX,
      y: dragY,
    };
    nodeData.push(obj);

    const connectionData = this.getConnectionData();
    const newVisoData = {
      nodeData,
      connectionData,
    };
    localStorage.setItem('visoData', JSON.stringify(newVisoData));
    this.loadDataAndPaint();
  };

  // 绑定删除连接线的操作处理
  bindDeleteConnection() {
    jsPlumb.bind('dblclick', function(connection) {
      if (window.confirm('确定删除所点击的连接线吗？')) {
        // 删除指定连接线
        jsPlumb.deleteConnection(connection);
      }
    });
  }

  // 绑定连接线添加label文本
  bindConnectionAddLabel() {
    // 建立连接线之前触发
    // 返回true正常建立连线，返回false取消连接
    jsPlumb.bind('beforeDrop', (info, originalEvent) => {
      const labelText = window.prompt('请输入连接线的label') || '';

      if (labelText) {
        info.connection.setLabel(this.getLabelSetInfo(labelText));
      }

      return true;
    });
  }

  // 绑定加载数据的操作数据
  // bindLoadData() {
  //   document.querySelector('#loadData').addEventListener('click', () => {
  //     this.loadDataAndPaint();
  //   });
  // }

  // 绑定保存数据的操作数据
  bindSaveData() {
    document.querySelector('#saveData').addEventListener('click', () => {
      const nodeData = this.getNodeData();
      const connectionData = this.getConnectionData();

      const visoData = {
        nodeData,
        connectionData,
      };

      console.log('保存数据', visoData);
      localStorage.setItem('visoData', JSON.stringify(visoData));
      this.setState({
        isShowResult: true,
        showResult: JSON.stringify(visoData),
      });
    });
  }

  // 绑定清除内容的操作数据
  bindClearData() {
    document.querySelector('#clearData').addEventListener('click', () => {
      this.clearCont();
    });
  }

  // 绑定删除节点操作
  bindRemoveNode() {
    document.querySelector(containerSelector).addEventListener('click', event => {
      if (this.matchesSelector(event.target, '.viso-close')) {
        const id = event.target.parentNode.getAttribute('id');
        jsPlumb.remove(id);
      }
    });
  }

  // 绑定展示数据详情
  bindShowData() {
    document.querySelector(containerSelector).addEventListener('click', event => {
      let id = event.target.parentNode.getAttribute('id');
      if (!id || id === 'diagramContainer') {
        id = event.target.getAttribute('id');
      }
      console.log(id);
      this.showDataTypes(id);
    });
  }
  // 右侧展示属性
  showDataTypes = id => {
    const defData = { connectionData: [], nodeData: [] };
    const storageData = localStorage.getItem('visoData');
    const visoData = storageData ? JSON.parse(storageData) : defData;
    const nodeData = visoData.nodeData;
    let obj = nodeData.find(item => item.id === id);
    if (obj) {
      this.setState({
        nodeTypesSource: obj,
        nodeDescription: obj.description || '',
      });
    }
  };

  // 绑定节点内容编辑
  bindEditNodeName() {
    document.querySelector(containerSelector).addEventListener('dblclick', event => {
      let visoItem;
      if (this.matchesSelector(event.target, '.viso-item')) {
        visoItem = event.target;
      } else if (this.matchesSelector(event.target.parentNode, '.viso-item')) {
        visoItem = event.target.parentNode;
      }

      const eleName = visoItem && visoItem.querySelector('.viso-name');
      const type = visoItem && visoItem.getAttribute('data-type').toLocaleLowerCase();
      if (eleName && type.indexOf('gateway') === -1) {
        const text = (eleName.innerText || eleName.textContent).replace(/^\s+|\s+$/g, '');
        const eleInput = visoItem.querySelector('.viso-input');

        if (eleInput) {
          eleInput.value = text;
          eleInput.style.display = 'block';
          this.moveEnd(eleInput);
        } else {
          const appendInput = document.createElement('input');
          appendInput.className = 'viso-input';
          appendInput.value = text;
          appendInput.addEventListener('blur', event => {
            this.saveInput(event.target);
          });
          visoItem.appendChild(appendInput);
          this.moveEnd(appendInput);
        }

        canChangeLayout && (visoItem.querySelector('.viso-close').style.display = 'block');
      }
    });

    document.querySelector(containerSelector).addEventListener('keyup', event => {
      if (this.matchesSelector(event.target, '.viso-input')) {
        if (event.keyCode === 13) {
          this.saveInput(event.target);
        }
      }
    });
  }

  // 保存数据
  saveInput(ele) {
    const val = ele.value;
    if (val.trim() !== '') {
      const eleName = ele.parentNode.querySelector('.viso-name');
      eleName.innerHTML = '';
      eleName.appendChild(document.createTextNode(val));
    }
    ele.style.display = 'none';
    canChangeLayout && (ele.parentNode.querySelector('.viso-close').style.display = 'none');
  }

  // 光标移至末尾
  moveEnd(ele) {
    ele.focus();
    var len = ele.value.length;
    if (document.selection) {
      var sel = ele.createTextRange();
      sel.moveStart('character', len);
      sel.collapse();
      sel.select();
    } else if (typeof ele.selectionStart == 'number' && typeof ele.selectionEnd == 'number') {
      ele.selectionStart = ele.selectionEnd = len;
    }
  }

  // element.matches兼容处理
  matchesSelector(ele, selector) {
    if (ele.matches) {
      return ele.matches(selector);
    } else if (ele.matchesSelector) {
      return ele.matchesSelector(selector);
    } else if (ele.webkitMatchesSelector) {
      return ele.webkitMatchesSelector(selector);
    } else if (ele.msMatchesSelector) {
      return ele.msMatchesSelector(selector);
    } else if (ele.mozMatchesSelector) {
      return ele.mozMatchesSelector(selector);
    } else if (ele.oMatchesSelector) {
      return ele.oMatchesSelector(selector);
    }
  }

  // 编辑弹窗点击确认，保存连线label和成立条件
  handleEditModalOnOK = () => {
    this.state.labelOverlay.setLabel(this.state.editModalLabelText || '');
    ConditionCache[
      this.state.editModalSourceId + ':' + this.state.eiditModalTargetid
    ] = this.state.editModalCondition;
    this.setState({
      showEditModal: false,
    });
  };

  // 编辑弹窗：修改label文本
  handleChangeLabelText = event => {
    this.setState({
      editModalLabelText: event.target.value,
    });
  };

  // 编辑弹窗：修改成立条件
  handleChangeCondition = event => {
    this.setState({
      editModalCondition: event.target.value,
    });
  };

  // 弹出表单配置弹窗
  addTypesBtn = () => {
    this.setState({
      formVisible: true,
    });
  };

  // 表单配置取消
  formConfigCancel = () => {
    this.setState({
      formVisible: false,
    });
  };
  // 表单配置保存
  formConfigOk = () => {
    console.log('配置保存');
    this.setState({
      formVisible: false,
    });
  };

  //右侧属性失去焦点保存
  onBlurChange = id => {
    console.log(id);
    const { nodeDescription } = this.state;
    const defData = { connectionData: [], nodeData: [] };
    const storageData = localStorage.getItem('visoData');
    const visoData = storageData ? JSON.parse(storageData) : defData;
    const nodeData = visoData.nodeData;
    let obj = nodeData.find(item => item.id === id);
    if (obj) {
      obj.description = nodeDescription;
    }
    const connectionData = this.getConnectionData();
    const newVisoData = {
      nodeData,
      connectionData,
    };
    localStorage.setItem('visoData', JSON.stringify(newVisoData));
    this.loadDataAndPaint();
  };
  // 节点属性change
  nodeDescriptionChange = e => {
    console.log(e.target.value);
    this.setState({
      nodeDescription: e.target.value,
    });
  };

  showResultCancel = () => {
    this.setState({
      isShowResult: false,
      showResult: '',
    });
  };

  // DOM渲染
  render() {
    const formItemLayout = {
      labelCol: { span: 8 },
      wrapperCol: { span: 16 },
    };
    console.log(this.state.nodeList);
    console.log(this.state.nodeTypesSource);
    return (
      <div id="visobox">
        <div className="visobox-left">
          <div className="operate-item">
            <div>
              <DndProvider backend={Backend}>
                <DragComponent name="类型1" type="type1" dragEndHandle={this.dragEndHandle} />
                <DragComponent name="类型2" type="type2" dragEndHandle={this.dragEndHandle} />
                <DragComponent name="类型3" type="type3" dragEndHandle={this.dragEndHandle} />
              </DndProvider>
            </div>
            {/* <Button id="loadData" style={{ width: '100%' }}>
              加载数据
            </Button> */}
          </div>
          <div className="operate-item">
            <Button id="clearData" style={{ width: '100%' }}>
              清除内容
            </Button>
          </div>
          <div className="operate-item">
            <Button id="saveData" type="primary" style={{ width: '100%' }}>
              保存数据
            </Button>
          </div>
        </div>
        <div id="diagramContainer">{this.state.nodeList}</div>
        <div className="visobox-right">
          <div className="right-types">节点属性</div>
          {this.state.nodeTypesSource.name ? (
            <div>
              <div className="right-types-item">
                id:
                <div> {this.state.nodeTypesSource.id}</div>
              </div>
              <div className="right-types-item">
                节点类型:
                <div> {this.state.nodeTypesSource.type}</div>
              </div>
              <div className="right-types-item">
                <div>节点名称：</div>
                <div> {this.state.nodeTypesSource.name}</div>
              </div>
              <div className="right-types-item">
                description:
                <Input
                  placeholder="请输入"
                  onChange={this.nodeDescriptionChange}
                  value={this.state.nodeDescription}
                  onBlur={this.onBlurChange.bind(this, this.state.nodeTypesSource.id)}
                />
              </div>
              <div className="right-types-item">
                <div>表单配置</div>
                <Button onClick={this.addTypesBtn} style={{ width: '100%' }}>
                  表单配置
                </Button>
              </div>
            </div>
          ) : (
            <div>暂无数据</div>
          )}
        </div>
        <Modal
          width={300}
          title="编辑条件"
          visible={this.state.showEditModal}
          onOk={this.handleEditModalOnOK}
          onCancel={() => {
            this.setState({ showEditModal: false });
          }}
          okText="确认"
          cancelText="取消"
        >
          <div>
            <FormItem label="配置条件：" colon={false} required={false} {...formItemLayout}>
              <Input value={this.state.editModalCondition} onChange={this.handleChangeCondition} />
            </FormItem>
          </div>
          <div>
            <FormItem label="显示文本：" colon={false} required={false} {...formItemLayout}>
              <Input value={this.state.editModalLabelText} onChange={this.handleChangeLabelText} />
            </FormItem>
          </div>
        </Modal>
        <Modal
          title="表单配置"
          width={800}
          visible={this.state.formVisible}
          onOk={this.formConfigOk}
          onCancel={this.formConfigCancel}
        >
          <p>按钮配置1</p>
        </Modal>
        <Modal
          title="保存数据"
          width={800}
          footer={null}
          visible={this.state.isShowResult}
          onCancel={this.showResultCancel}
        >
          <p>json格式</p>
          <div style={{ padding: 8, border: '1px solid #ccc', maxHeight: 300, overflow: 'auto' }}>
            {this.state.showResult}
          </div>
        </Modal>
      </div>
    );
  }
}
export default Index;
