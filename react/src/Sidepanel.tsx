import { FaWind, FaDroplet, FaCircleExclamation, FaCircleCheck, FaCircleXmark, FaArrowUpRightDots, FaUser, FaCircleInfo } from 'react-icons/fa6';
import {CardGroup} from './Card';
import {useState} from 'react';
import './Sidepanel.scss'


/**
 * Creates a sidepanel that floats left above everything else on the page
 * contains a vertical scrolling list of cards
 */
export const Panel = (props: any) => {
  console.log(props);

  const [recommendations] = useState([
    {title: "Today's Recommendations", body: () => <p>Due to recent rain, we recommend avoiding the beaches due to pollution runoff.</p>, icon: FaCircleInfo},
  ]);

  const [transparency] = useState([
    {title: "What we know", body: () => <p>The city has been working on a new plan to reduce pollution in the bay.</p>, icon: FaCircleCheck},
    {title: "What we don't know", body: () => <p>The city has not yet released the details of the plan.</p>, icon: FaCircleXmark},
    {title: "What we're doing", body: () => <p>We are working with the city to get more information.</p>, icon: FaArrowUpRightDots},
    {title: "What you can do", body: () => <p>You can help by reducing your own pollution.</p>, icon: FaUser}
  ]);

  const [measurements] = useState([
    {title: "Air Quality", value: 0.2, icon: FaWind},
    {title: "Water Quality", value: 0.5, icon: FaDroplet},
    {title: "Complaints", icon: FaCircleExclamation}
  ]);

  return <div id="sidebar" className="sidebar">
    <CardGroup title="Recommendations" children={recommendations} />
    <CardGroup title="Transparency" children={transparency} />
    <CardGroup title="Measurements" children={measurements} />
  </div>;
}



