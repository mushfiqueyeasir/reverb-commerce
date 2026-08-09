import NotFoundScreen from "@/components/Common/NotFoundScreen";

export default function AdminNotFound() {
  return (
    <NotFoundScreen
      variant="standalone"
      primaryHref="/admin"
      primaryLabel="Dashboard"
      secondaryHref="/admin/login"
      secondaryLabel="Sign in"
    />
  );
}
