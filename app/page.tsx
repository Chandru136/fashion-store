import StorefrontLayout from "./(store)/layout";
import StoreHomePage from "./(store)/page";

export default function HomePageRoute() {
  return (
    <StorefrontLayout>
      <StoreHomePage />
    </StorefrontLayout>
  );
}
