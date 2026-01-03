import { useContext, useEffect } from "react";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { UserContext } from "../context/UserContext";

const PushInit = () => {
    const { user } = useContext(UserContext);
    const { ensureSubscription, isPushSupported } = usePushNotifications();
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    useEffect(() => {
        const alreadyAsked = localStorage.getItem("agrowtrack-push-optin");
        if (!user || !isPushSupported() || alreadyAsked === "denied") return;

        const run = async () => {
            const result = await ensureSubscription({ vapidKey, userId: user?._id });
            if (result.permission === "denied") {
                localStorage.setItem("agrowtrack-push-optin", "denied");
            }
            if (result.subscription) {
                localStorage.setItem("agrowtrack-push-optin", "granted");
            }
        };

        run();
    }, [ensureSubscription, isPushSupported, user, vapidKey]);

    return null;
};

export default PushInit;
