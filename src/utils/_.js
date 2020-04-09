// 获取系统高度
export const getClientHeight = () => {
  return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
};
export const getRegionWidth = () => {
  const clientWidth =
    window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const visoboxL = document.getElementById('visobox-left');
  const visoboxR = document.getElementById('visobox-right');
  // 获取左侧区域宽度
  const visoboxLW = visoboxL.offsetWidth || visoboxL.clientWidth;
  // 获取右侧区域宽度
  const visoboxRW = visoboxR.offsetWidth || visoboxR.clientWidth;

  return clientWidth - visoboxLW - visoboxRW;
};
