import React, { useEffect, useState } from "react";
import styles from "./OutfitList.module.scss";
import OutfitCard from "../OutfitCard/OutfitCard";

export default function OutfitList() {
    const [outfits, setOutfits] = useState([]);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        async function fetchOutfits() {
            try {
                const response = await fetch(
                    "http://127.0.0.1:8000/api/outfits"
                );
                if (!response.ok) {
                    throw new Error("Ошибка при загрузке образов");
                }
                const result = await response.json();
                setOutfits(result);
            } catch (error) {
                setError(error.message);
            }
        }
        fetchOutfits();
    }, []);

    if (error)
        return <div className={styles.RecommendedList__error}>{error}</div>;

    return (
        <div className="container">
              <h2 className={styles.outfitList__title}>Готовые образы</h2>
              <div className={styles.outfitList__wrapper}>
                {outfits.map((outfit) => (
                    <OutfitCard 
                        key={outfit.id}
                        image={outfit.image}
                        name={outfit.name}
                        price={outfit.total_price}
                    />
                ))}
              </div>
            </div>
    );
}