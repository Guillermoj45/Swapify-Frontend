import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home/Home';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import RegisterPage from "./pages/Register/RegisterPage";
import LoginPage from "./pages/Login/LoginPage";
import ProductsPage from "./pages/Products/ProductsPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import PasswordRecover from "./pages/PasswordRecovery/PasswordRecover";
import IA from "./pages/IA/IAPage";
import ChatPage from "./pages/Chats/ChatPage";
import SuscripcionPage from "./pages/Suscripcion/SuscripcionPage";
import PagoPremium from "./pages/PagoPremium/PagoPremium";
import ProductDetailPage from "./pages/ProductDetail/ProductDetailPage";
import SettingsPage from "./pages/Settings/SettingsPage";

setupIonicReact();

const App: React.FC = () => (
    <IonApp>
        <IonReactRouter>
            <IonRouterOutlet>
                <Route exact path="/">
                    <Redirect to="/register" />
                </Route>
                <Route exact path="/home">
                    <Home />
                </Route>
                <Route exact path="/register">
                    <RegisterPage />
                </Route>
                <Route exact path="/login">
                    <LoginPage />
                </Route>
                <Route exact path="/products">
                    <ProductsPage />
                </Route>
                <Route exact path="/profile">
                    <ProfilePage />
                </Route>
                <Route exact path="/passwordRecover">
                    <PasswordRecover/>
                </Route>
                <Route exact path="/IA">
                    <IA/>
                </Route>
                <Route exact path="/premiumSuscribe">
                    <SuscripcionPage />
                </Route>
                <Route exact path="/paymentGateway">
                    <PagoPremium/>
                </Route>
                <Route exact path="/Chat">
                    <ChatPage/>
                </Route>
                <Route exact path="/product/:id">
                    <ProductDetailPage/>
                </Route>
                <Route exact path="/settings">
                    <SettingsPage />
                </Route>
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
);

export default App;
