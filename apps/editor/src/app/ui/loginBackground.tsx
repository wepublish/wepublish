import styled from '@emotion/styled';

import { Logo } from './logo';

const BgWrapper = styled.div`
  position: relative;
  width: 340px;
  height: 40px;
  transform: translateY(-0px);
`;

const Shape1 = styled.div`
  position: absolute;
  left: 50%;
  width: 260px;
  height: 260px;
  border-radius: 100%;
  transform: translateX(-50%) translateX(-180px) translateY(-40px);
  background: linear-gradient(230deg, #f08c1f 0%, #ffa463 100%);
`;

const Shape2 = styled.div`
  position: absolute;
  left: 50%;
  width: 260px;
  height: 260px;
  border-radius: 100%;
  transform: translateX(-50%) translateX(180px) translateY(-40px);
  background: linear-gradient(10deg, #29805a 0%, #34d690 100%);
`;

const Shape3 = styled.div`
  position: absolute;
  left: 50%;
  width: 260px;
  height: 260px;
  border-radius: 100%;
  transform: translateX(-50%) translateY(-140px);
  background: linear-gradient(-40deg, #03738c 0%, #04c4d9 100%);
`;

const Shape4 = styled.div`
  position: absolute;
  width: 340px;
  height: 340px;
  border-radius: 100%;
  transform: translateY(-80px);
  background: linear-gradient(-90deg, #d95560 0%, #ff6370 100%);
`;

const LogoWrapper = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 230px;
`;

export const Background = () => (
  <BgWrapper>
    <Shape1 />
    <Shape2 />
    <Shape3 />
    <Shape4 />
    <LogoWrapper>
      <Logo />
    </LogoWrapper>
  </BgWrapper>
);
