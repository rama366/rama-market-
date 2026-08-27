import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Account from "./pages/Account";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import Listings from "./pages/Listings";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/listings" component={Listings} />
    <Route path="/listings/:id" component={ListingDetail} />
    <Route path="/onboarding" component={Onboarding} />
    <Route path="/account" component={Account} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-center" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

