import { IconType } from "react-icons";
import { FaBeer, FaChevronUp, FaChevronDown } from "react-icons/fa";

export function Card(props: {title: string, body?: any, value?: number, icon?: IconType, expanded?: boolean}) {
  console.log("Card", props);
  const Icon = props.icon || FaBeer;
  const Chevron = props.expanded ? FaChevronUp : FaChevronDown;
  return <div id="card" className={props.expanded ? "expanded" : "collapse"}>
    <div className="header">
        <Icon />
        <h4>{props.title}</h4>
        {props.value && <Stoplight value={props.value} />}
        <Chevron />
    </div>
    <div className="content">
        {props.body && <p>{props.body}</p>}
    </div>
  </div>;
}

export function CardGroup(props: {title: string, children: any[]}) {
    return <div id="card-group">
        <h3 id="card-separator">{props.title}</h3>
        {props.children.map((child) => 
            <Card 
                title={child.title} 
                body={child?.body} 
                value={child?.value} 
                icon={child?.icon} 
                expanded={child?.expanded}
            />)}
    </div>;
}

export function Stoplight(props: {value: number}) {
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