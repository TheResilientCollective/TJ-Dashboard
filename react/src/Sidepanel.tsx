import { FaWind, FaDroplet, FaCircleExclamation, FaCircleCheck, FaCircleXmark, FaArrowUpRightDots, FaUser, FaCircleInfo } from 'react-icons/fa6';
import {CardGroup} from './Card';


const recommendations = [
  {title: "Today's Recommendations", body: "Due to recent rain, we recommend avoiding the beaches due to pollution runoff.", icon: FaCircleInfo},
];

const transparency = [
  {title: "What we know", body: "The city has been working on a new plan to reduce pollution in the bay.", icon: FaCircleCheck},
  {title: "What we don't know", body: "The city has not yet released the details of the plan.", icon: FaCircleXmark},
  {title: "What we're doing", body: "We are working with the city to get more information.", icon: FaArrowUpRightDots},
  {title: "What you can do", body: "You can help by reducing your own pollution.", icon: FaUser}
]

const measurements = [
  {title: "Air Quality", value: 0.2, icon: FaWind},
  {title: "Water Quality", value: 0.5, icon: FaDroplet},
  {title: "Complaints", icon: FaCircleExclamation}
]

/**
 * Creates a sidepanel that floats left above everything else on the page
 * contains a vertical scrolling list of cards
 */
export function Panel(props: any) {
  console.log(props);
  return <div id="panel">
    <CardGroup title="Recommendations" children={recommendations} />
    <CardGroup title="Transparency" children={transparency} />
    <CardGroup title="Measurements" children={measurements} />
  </div>;
}



