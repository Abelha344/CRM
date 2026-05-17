import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import ClerkProviderWithRouter from './components/ClerkProviderWithRouter.jsx'
import { store } from './store'
import { getClerkPublishableKey, isClerkConfigured } from './utils/clerkEnv'
import './index.css'
import App from './App.jsx'

const publishableKey = getClerkPublishableKey()
const clerkEnabled = isClerkConfigured(publishableKey)

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      {clerkEnabled ? (
        <ClerkProviderWithRouter publishableKey={publishableKey}>
          <App />
        </ClerkProviderWithRouter>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </Provider>,
)
