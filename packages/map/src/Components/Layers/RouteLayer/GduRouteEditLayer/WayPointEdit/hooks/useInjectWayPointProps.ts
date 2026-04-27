import { inject } from "vue";
import {
  EditTurnPointListKey,
  GroupWayPointKey,
  WayPointDataInfoKey,
  WayPointEditEmitsKey,
  WayPointEditPropsKey,
  WayPointEditSelectDataInfoKey,
} from "./useProvideWayPointProps";

export function useInjectWayPointProps() {
  const wayPointProps = inject(WayPointEditPropsKey)!;
  const wayPointEmits = inject(WayPointEditEmitsKey)!;
  const dataInfo = inject(WayPointDataInfoKey)!;
  const selectInfo = inject(WayPointEditSelectDataInfoKey)!;
  const editTurnPointList = inject(EditTurnPointListKey)!;
  const groupWayPointList = inject(GroupWayPointKey)!;
  return {
    dataInfo,
    selectInfo,
    editTurnPointList,
    wayPointProps,
    wayPointEmits,
    groupWayPointList,
  };
}
