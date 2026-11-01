import { Button, Result } from "antd";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Result
        status="404"
        title="Page not found"
        subTitle="The page you are looking for doesn't exist or has moved."
        extra={
          <Link to="/dashboard">
            <Button type="primary">Back to dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
