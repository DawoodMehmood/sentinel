import Breadcrumb from "@/components/Common/Breadcrumb";
import NotFound from "@/components/NotFound";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 Page | Sentinel Next.js",
};

const ErrorPage = () => {
  return (
    <body>
      <Breadcrumb pageName="404 Page" />

      <NotFound />
    </body>
  );
};

export default ErrorPage;
