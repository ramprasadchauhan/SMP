import { Button, Result } from "antd";
import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Result
        status="403"
        title="Access denied"
        subTitle="You don't have permission to view this page. If you think this is a mistake, contact an administrator."
        extra={
          <Link to="/dashboard">
            <Button type="primary">Back to dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
