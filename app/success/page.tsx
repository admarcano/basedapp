"use client";

import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { minikitConfig } from "../../minikit.config";
import styles from "./page.module.css";

export default function Success() {

  const { composeCastAsync } = useComposeCast();
  
  const handleShare = async () => {
    try {
      const text = `Check out ${minikitConfig.miniapp.name}! `;
      
      const result = await composeCastAsync({
        text: text,
        embeds: [process.env.NEXT_PUBLIC_URL || ""]
      });

      // result.cast can be null if user cancels
      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} type="button">
        ✕
      </button>
      
      <div className={styles.content}>
        <div className={styles.successMessage}>
          <div className={styles.checkmark}>
            <div className={styles.checkmarkCircle}>
              <div className={styles.checkmarkStem}></div>
              <div className={styles.checkmarkKick}></div>
            </div>
          </div>
          
          <h1 className={styles.title}>Welcome to {minikitConfig.miniapp.name.toUpperCase()}!</h1>
          
          <p className={styles.subtitle}>
            Your trading bot is ready to use.<br />
            Start trading automatically with intelligent strategies.
          </p>

          <button onClick={handleShare} className={styles.shareButton}>
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
}
