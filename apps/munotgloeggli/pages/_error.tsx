import { NextPageContext } from 'next';
import Error from 'next/error';

// Define the type for the component's props
interface CustomErrorComponentProps {
  statusCode: number;
}

const CustomErrorComponent = ({ statusCode }: CustomErrorComponentProps) => {
  return <Error statusCode={statusCode} />;
};

CustomErrorComponent.getInitialProps = async (contextData: NextPageContext) => {
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
