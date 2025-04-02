import { IconType } from "react-icons";
import { FaBeer, FaChevronUp, FaChevronDown } from "react-icons/fa";
import { useState } from "react";
import './Card.css'

interface CardProps {
    title: string;
    body?: string;
    value?: number;
    icon?: IconType;
    isExpanded?: boolean;
    onToggle: () => void;
}

/**
 * A rectangular card with drop shadow.
 * Card expands and collapses when clicked.
 * Fills container width.
 * When collapsed, card shows icon, title, stoplight value if provided, and a expand/collapse icon.
 * When expanded, card shows the above plus body text.
 */
export const Card = (props: CardProps) => {
  const Icon = props.icon || FaBeer;
  const Chevron = props.isExpanded ? FaChevronUp : FaChevronDown;
  const Body = props.body || (() => null);

  return <div id="card" className={props.isExpanded ? "expanded" : "collapse"} >
    <div className="card-header" class="card-header">
        <Icon />
        <h4>{props.title}</h4>
        {props.value && <Stoplight value={props.value} />}
        <Chevron onClick={props.onToggle} />
    </div>
    <div className="content" class="c">
        <Body />
    </div>
  </div>;
}

/**
 * A group of cards with a title.
 * The group itself doesn't have any styling on it, so padding must be added to card's parent element.
 * Fills container width.
 */
export const CardGroup = (props: {title: string, children: any[]}) => {
    const [cards, setCards] = useState(props.children.map(child => ({ ...child, isExpanded: child.expanded || false }))); // Initialize isExpanded

    const handleCardToggle = (index: number) => {
        setCards(prevCards => {
            const newCards = [...prevCards];
            newCards[index].isExpanded = !newCards[index].isExpanded;
            return newCards;
        });
    };

    return <div id="card-group">
        <h3 id="card-separator">{props.title}</h3>
        {cards.map((card, index) =>
            <Card
                key={index}
                title={card.title}
                body={card?.body}
                value={card?.value}
                icon={card?.icon}
                isExpanded={card.isExpanded}
                onToggle={() => handleCardToggle(index)}
            />)}
    </div>;
}

/**
 * A stoplight indicator for values between 0 and 1.
 * Red for values less than 0.3, yellow for values less than 0.7, and green for values greater than 0.7.
 */
export const Stoplight = (props: {value: number}) => {
    if (props.value < 0.3) {
        return <div className="stoplight red"></div>;
    }
    else if (props.value < 0.7) {
        return <div className="stoplight yellow"></div>;
    }
    else {
        return <div className="stoplight green"></div>;
    }
}
