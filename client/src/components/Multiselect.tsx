// This component is slightly adapted from https://github.com/srigar/multiselect-react-dropdown

// @ts-nocheck
import React, { useRef, useEffect } from "react";
import "../styles/Multiselect.scss";
import "../styles/_button.scss";
import { CloseButton } from "./CloseButton";
import { Trans } from "@lingui/macro";
import { Alert } from "./Alert";
import classnames from "classnames";

const KEY_ESC = 27;

export interface IMultiselectProps {
  options: any;
  disablePreSelectedValues?: boolean;
  selectedValues?: any;
  isObject?: boolean;
  displayValue?: string;
  showCheckbox?: boolean;
  selectionLimit?: any;
  placeholder?: string;
  loading?: boolean;
  style?: object;
  emptyRecordMsg?: string;
  onSelect?: (selectedList: any, selectedItem: any) => void;
  onRemove?: (selectedList: any, selectedItem: any) => void;
  onSearch?: (value: string) => void;
  onKeyPressFn?: (event: any, value: string) => void;
  onApply: (selectedList: any) => void;
  onFocusInput?: () => void;
  infoAlert?: React.ReactNode;
  caseSensitiveSearch?: boolean;
  id?: string;
  closeOnSelect?: boolean;
  avoidHighlightFirstOption?: boolean;
  hidePlaceholder?: boolean;
  showArrow?: boolean;
  keepSearchTerm?: boolean;
  customArrow?: any;
  disable?: boolean;
  className?: string;
  selectedValueDecorator?: (v: string, option: any) => React.ReactNode | string;
  optionValueDecorator?: (v: string, option: any) => React.ReactNode | string;
  hideSelectedList?: boolean;
  /**
   * How many selected value chips to display before "show more" button
   */
  previewSelectedNum?: number;
}

export class Multiselect extends React.Component<IMultiselectProps, any> {
  static defaultProps: IMultiselectProps;
  constructor(props) {
    super(props);
    this.state = {
      inputValue: "",
      options: props.options,
      filteredOptions: props.options,
      unfilteredOptions: props.options,
      selectedValues: Object.assign([], props.selectedValues),
      preSelectedValues: Object.assign([], props.selectedValues),
      showAllSelected: false,
      toggleOptionsList: false,
      highlightOption: props.avoidHighlightFirstOption ? -1 : 0,
      showCheckbox: props.showCheckbox,
      keepSearchTerm: props.keepSearchTerm,
      hasError: false,
    };
    // @ts-ignore
    this.optionTimeout = null;
    // @ts-ignore
    this.searchWrapper = React.createRef();
    // @ts-ignore
    this.searchBox = React.createRef();
    this.onChange = this.onChange.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.renderMultiselectContainer = this.renderMultiselectContainer.bind(this);
    this.renderSelectedList = this.renderSelectedList.bind(this);
    this.onRemoveSelectedItem = this.onRemoveSelectedItem.bind(this);
    this.toggleShowAllSelected = this.toggleShowAllSelected.bind(this);
    this.toggelOptionList = this.toggelOptionList.bind(this);
    this.onArrowKeyNavigation = this.onArrowKeyNavigation.bind(this);
    this.onEscKeyCloseOptionList = this.onEscKeyCloseOptionList.bind(this);
    this.onSelectItem = this.onSelectItem.bind(this);
    this.filterOptionsByInput = this.filterOptionsByInput.bind(this);
    this.removeSelectedValuesFromOptions = this.removeSelectedValuesFromOptions.bind(this);
    this.isSelectedValue = this.isSelectedValue.bind(this);
    this.fadeOutSelection = this.fadeOutSelection.bind(this);
    this.isDisablePreSelectedValues = this.isDisablePreSelectedValues.bind(this);
    this.renderNormalOption = this.renderNormalOption.bind(this);
    this.listenerCallback = this.listenerCallback.bind(this);
    this.resetSelectedValues = this.resetSelectedValues.bind(this);
    this.getSelectedItems = this.getSelectedItems.bind(this);
    this.getSelectedItemsCount = this.getSelectedItemsCount.bind(this);
    this.hideOnClickOutside = this.hideOnClickOutside.bind(this);
    this.onCloseOptionList = this.onCloseOptionList.bind(this);
    this.isVisible = this.isVisible.bind(this);
  }

  initialSetValue() {
    const { showCheckbox } = this.props;
    if (!showCheckbox) {
      this.removeSelectedValuesFromOptions(false);
    }
  }

  resetSelectedValues() {
    const { unfilteredOptions } = this.state;
    return new Promise((resolve) => {
      this.setState(
        {
          selectedValues: [],
          preSelectedValues: [],
          options: unfilteredOptions,
          filteredOptions: unfilteredOptions,
        },
        () => {
          // @ts-ignore
          resolve();
          this.initialSetValue();
        }
      );
    });
  }

  getSelectedItems() {
    return this.state.selectedValues;
  }

  getSelectedItemsCount() {
    return this.state.selectedValues.length;
  }

  componentDidMount() {
    this.initialSetValue();
    // @ts-ignore
    this.searchWrapper.current.addEventListener("click", this.listenerCallback);
  }

  componentDidUpdate(prevProps) {
    const { options, selectedValues } = this.props;
    const { options: prevOptions, selectedValues: prevSelectedvalues } = prevProps;
    if (JSON.stringify(prevOptions) !== JSON.stringify(options)) {
      this.setState(
        { options, filteredOptions: options, unfilteredOptions: options },
        this.initialSetValue
      );
    }
    if (JSON.stringify(prevSelectedvalues) !== JSON.stringify(selectedValues)) {
      this.setState(
        {
          selectedValues: Object.assign([], selectedValues),
          preSelectedValues: Object.assign([], selectedValues),
        },
        this.initialSetValue
      );
    }
  }

  listenerCallback() {
    // @ts-ignore
    this.searchBox.current.focus();
  }

  componentWillUnmount() {
    // @ts-ignore
    if (this.optionTimeout) {
      // @ts-ignore
      clearTimeout(this.optionTimeout);
    }
    // @ts-ignore
    this.searchWrapper.current.removeEventListener("click", this.listenerCallback);
  }

  // Skipcheck flag - value will be true when the func called from on deselect anything.
  removeSelectedValuesFromOptions(skipCheck) {
    const { isObject, displayValue } = this.props;
    const { selectedValues = [], unfilteredOptions } = this.state;
    if (!selectedValues.length && !skipCheck) {
      return;
    }
    if (isObject) {
      let optionList = unfilteredOptions.filter((item) => {
        return selectedValues.findIndex((v) => v[displayValue] === item[displayValue]) === -1
          ? true
          : false;
      });
      this.setState(
        { options: optionList, filteredOptions: optionList },
        this.filterOptionsByInput
      );
      return;
    }
    let optionList = unfilteredOptions.filter((item) => selectedValues.indexOf(item) === -1);

    this.setState({ options: optionList, filteredOptions: optionList }, this.filterOptionsByInput);
  }

  onChange(event) {
    const { onSearch } = this.props;
    this.setState(
      {
        inputValue: event.target.value,
        hasError: this.state.hasError && event.target.value === "",
      },
      this.filterOptionsByInput
    );
    if (onSearch) {
      onSearch(event.target.value);
    }
  }

  onKeyPress(event) {
    const { onKeyPressFn } = this.props;
    if (onKeyPressFn) {
      onKeyPressFn(event, event.target.value);
    }
  }

  filterOptionsByInput() {
    let { options, filteredOptions, inputValue } = this.state;
    const { isObject, displayValue } = this.props;
    if (isObject) {
      options = filteredOptions.filter((i) => this.matchValues(i[displayValue], inputValue));
    } else {
      options = filteredOptions.filter((i) => this.matchValues(i, inputValue));
    }
    this.setState({ options });
  }

  matchValues(value, search) {
    if (this.props.caseSensitiveSearch) {
      return value.indexOf(search) > -1;
    }
    if (value.toLowerCase) {
      return value.toLowerCase().indexOf(search.toLowerCase()) > -1;
    }
    return value.toString().indexOf(search) > -1;
  }

  onArrowKeyNavigation(e) {
    const { options, highlightOption, toggleOptionsList, inputValue, selectedValues } = this.state;
    const { disablePreSelectedValues } = this.props;
    if (e.keyCode === 8 && !inputValue && !disablePreSelectedValues && selectedValues.length) {
      this.onRemoveSelectedItem(selectedValues.length - 1);
    }
    if (!options.length) {
      return;
    }
    if (e.keyCode === 38) {
      if (highlightOption > 0) {
        this.setState((previousState) => ({
          highlightOption: previousState.highlightOption - 1,
        }));
      } else {
        this.setState({ highlightOption: options.length - 1 });
      }
    } else if (e.keyCode === 40) {
      if (highlightOption < options.length - 1) {
        this.setState((previousState) => ({
          highlightOption: previousState.highlightOption + 1,
        }));
      } else {
        this.setState({ highlightOption: 0 });
      }
    } else if (e.key === "Enter" && options.length && toggleOptionsList) {
      if (highlightOption === -1) {
        return;
      }
      this.onSelectItem(options[highlightOption]);
    }
  }

  onEscKeyCloseOptionList(e) {
    if (e.keyCode === KEY_ESC) {
      e.preventDefault();
      this.onCloseOptionList();
      this.searchBox.current.focus();
    }
  }

  onRemoveSelectedItem(item) {
    let { selectedValues, index = 0 } = this.state;
    const { onRemove, showCheckbox, displayValue, isObject } = this.props;
    if (isObject) {
      index = selectedValues.findIndex((i) => i[displayValue] === item[displayValue]);
    } else {
      index = selectedValues.indexOf(item);
    }
    selectedValues.splice(index, 1);
    onRemove(selectedValues, item);
    this.setState({ selectedValues }, () => {
      if (!showCheckbox) {
        this.removeSelectedValuesFromOptions(true);
      }
    });
    if (!this.props.closeOnSelect) {
      // @ts-ignore
      this.searchBox.current.focus();
    }
  }

  onSelectItem(item) {
    const { selectedValues } = this.state;
    const { selectionLimit, onSelect, showCheckbox } = this.props;
    this.setState({ hasError: false });
    if (!this.state.keepSearchTerm) {
      this.setState({
        inputValue: "",
      });
    }
    if (this.isSelectedValue(item)) {
      this.onRemoveSelectedItem(item);
      return;
    }
    if (selectionLimit === selectedValues.length) {
      return;
    }
    selectedValues.push(item);
    onSelect(selectedValues, item);
    this.setState({ selectedValues }, () => {
      if (!showCheckbox) {
        this.removeSelectedValuesFromOptions(true);
      } else {
        this.filterOptionsByInput();
      }
    });
    if (!this.props.closeOnSelect) {
      // @ts-ignore
      this.searchBox.current.focus();
    }
  }

  isSelectedValue(item) {
    const { isObject, displayValue } = this.props;
    const { selectedValues } = this.state;
    if (isObject) {
      return selectedValues.filter((i) => i[displayValue] === item[displayValue]).length > 0;
    }
    return selectedValues.filter((i) => i === item).length > 0;
  }

  renderOptionList() {
    const { id, style, emptyRecordMsg, loading, loadingMessage = "loading..." } = this.props;
    const { options, highlightOption } = this.state;
    if (loading) {
      return (
        <ul className={`optionContainer`} style={style["optionContainer"]}>
          {typeof loadingMessage === "string" && (
            <span style={style["loadingMessage"]} className={`notFound`}>
              {loadingMessage}
            </span>
          )}
          {typeof loadingMessage !== "string" && loadingMessage}
        </ul>
      );
    }
    return (
      <ul
        tabIndex="-1"
        role="listbox"
        className={`optionContainer`}
        style={style["optionContainer"]}
        aria-activedescendant={`${id || "option"}-item-${highlightOption}`}
      >
        {options.length === 0 && (
          <span style={style["notFound"]} className={`notFound`}>
            {emptyRecordMsg}
          </span>
        )}
        {this.renderNormalOption()}
      </ul>
    );
  }

  renderNormalOption() {
    const { isObject = false, id, displayValue, showCheckbox, style } = this.props;
    const { highlightOption } = this.state;
    return this.state.options.map((option, i) => {
      const isSelected = this.isSelectedValue(option);
      return (
        <li
          key={`option${i}`}
          id={`${id || "option"}-item-${i}`}
          style={style["option"]}
          className={`option ${isSelected ? "selected" : ""} ${
            highlightOption === i ? `highlightOption highlight` : ""
          } ${this.fadeOutSelection(option) ? "disableSelection" : ""} ${
            this.isDisablePreSelectedValues(option) ? "disableSelection" : ""
          }`}
          onClick={() => this.onSelectItem(option)}
          onKeyDown={this.onEscKeyCloseOptionList}
          role="option"
          aria-selected={isSelected}
          aria-label={isObject ? option[displayValue] : (option || "").toString()}
        >
          {showCheckbox && (
            <input
              id={`option-check-${i}`}
              type="checkbox"
              readOnly
              className="checkbox"
              checked={isSelected}
              onKeyDown={this.onEscKeyCloseOptionList}
            />
          )}
          <span>
            {this.props.optionValueDecorator(
              isObject ? option[displayValue] : (option || "").toString(),
              option
            )}
          </span>
        </li>
      );
    });
  }

  renderSelectedList() {
    const { isObject = false, displayValue, style, previewSelectedNum } = this.props;
    const { selectedValues, showAllSelected } = this.state;

    const selectedNum = showAllSelected ? selectedValues.length : previewSelectedNum;

    return (
      <>
        {selectedValues.slice(0, selectedNum).map((value, index) => (
          <span
            className={`chip ${this.isDisablePreSelectedValues(value) && "disableSelection"}`}
            key={index}
            style={style["chips"]}
          >
            {this.props.selectedValueDecorator(
              !isObject ? (value || "").toString() : value[displayValue],
              value
            )}
            {!this.isDisablePreSelectedValues(value) && (
              <CloseButton
                className="icon_cancel"
                onClick={() => this.onRemoveSelectedItem(value)}
              />
            )}
          </span>
        ))}
        {selectedValues.length > selectedNum && (
          <button
            className="chip chip-more"
            key={previewSelectedNum + 1}
            style={style["chips"]}
            onClick={this.toggleShowAllSelected}
          >
            +{selectedValues.length - previewSelectedNum}
          </button>
        )}
        {selectedNum > previewSelectedNum && (
          <button
            className="show-less button is-text"
            key={previewSelectedNum + 1}
            onClick={this.toggleShowAllSelected}
          >
            <Trans>Show less</Trans>
          </button>
        )}
      </>
    );
  }

  isDisablePreSelectedValues(value) {
    const { isObject, disablePreSelectedValues, displayValue } = this.props;
    const { preSelectedValues } = this.state;
    if (!disablePreSelectedValues || !preSelectedValues.length) {
      return false;
    }
    if (isObject) {
      return preSelectedValues.filter((i) => i[displayValue] === value[displayValue]).length > 0;
    }
    return preSelectedValues.filter((i) => i === value).length > 0;
  }

  toggleShowAllSelected() {
    this.setState({
      showAllSelected: !this.state.showAllSelected,
    });
  }

  fadeOutSelection(item) {
    const { selectionLimit, showCheckbox } = this.props;
    const { selectedValues } = this.state;
    if (selectionLimit === -1) {
      return false;
    }
    if (selectionLimit !== selectedValues.length) {
      return false;
    }
    if (selectionLimit === selectedValues.length) {
      if (!showCheckbox) {
        return true;
      } else {
        if (this.isSelectedValue(item)) {
          return false;
        }
        return true;
      }
    }
  }

  toggelOptionList() {
    this.setState({
      toggleOptionsList: !this.state.toggleOptionsList,
      highlightOption: this.props.avoidHighlightFirstOption ? -1 : 0,
    });
  }

  onCloseOptionList() {
    this.setState({
      toggleOptionsList: false,
      highlightOption: this.props.avoidHighlightFirstOption ? -1 : 0,
      // inputValue: "",
    });
  }

  onFocus() {
    if (this.state.toggleOptionsList) {
      // @ts-ignore
      clearTimeout(this.optionTimeout);
    } else {
      this.toggelOptionList();
    }
    this.props.onFocusInput();
  }

  isVisible(elem) {
    return !!elem && !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
  }

  hideOnClickOutside() {
    const element = document.getElementsByClassName("multiselect-container")[0];
    const outsideClickListener = (event) => {
      if (element && !element.contains(event.target) && this.isVisible(element)) {
        this.toggelOptionList();
      }
    };
    document.addEventListener("click", outsideClickListener);
  }

  renderMultiselectContainer() {
    const { inputValue, toggleOptionsList, selectedValues, hasError } = this.state;
    const {
      placeholder,
      style,
      id,
      name,
      hidePlaceholder,
      disable,
      className,
      hideSelectedList,
      onApply,
      infoAlert,
    } = this.props;
    return (
      <div
        className={`multiselect-container multiSelectContainer ${disable ? `disable_ms` : ""} ${
          className || ""
        }`}
        id={id || "multiselectContainerReact"}
        style={style["multiselectContainer"]}
      >
        {hasError && (
          <Alert type="error" variant="primary" closeType="none" role="status">
            <Trans>Error</Trans>
          </Alert>
        )}
        <div className="selectedListContainer">
          {!hideSelectedList && this.renderSelectedList()}
        </div>
        <div className="clear-all-container">
          {selectedValues.length > 0 && (
            <button
              className="clear-all button is-text"
              key={2}
              onClick={() => {
                this.resetSelectedValues();
                onApply([]);
              }}
            >
              <Trans>Clear</Trans>
            </button>
          )}
        </div>
        <div
          className={classnames("search-wrapper searchWrapper", { hasError: hasError })}
          ref={this.searchWrapper}
          style={style["searchBox"]}
          onClick={() => {}}
        >
          <input
            type="text"
            ref={this.searchBox}
            className="searchBox"
            id={`${id || "search"}_input`}
            name={`${name || "search_name"}_input`}
            onChange={this.onChange}
            onKeyPress={this.onKeyPress}
            value={inputValue}
            onFocus={this.onFocus}
            placeholder={hidePlaceholder && selectedValues.length ? "" : placeholder}
            onKeyDown={this.onArrowKeyNavigation}
            style={style["inputField"]}
            autoComplete="off"
            disabled={disable}
          />
        </div>
        <div
          className={`optionListContainer ${toggleOptionsList ? "displayBlock" : "displayNone"}`}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
        >
          {this.renderOptionList()}
        </div>
        {infoAlert ? infoAlert : <></>}
        <button
          onClick={() => {
            if (!selectedValues.length && !!inputValue) {
              this.setState({ hasError: true });
            } else {
              onApply(selectedValues);
              this.onCloseOptionList();
            }
          }}
          className="button is-primary"
        >
          <Trans>Apply</Trans>
        </button>
      </div>
    );
  }

  render() {
    return (
      <OutsideAlerter outsideClick={this.onCloseOptionList}>
        {this.renderMultiselectContainer()}
      </OutsideAlerter>
    );
  }
}

function useOutsideAlerter(ref, clickEvent) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        clickEvent();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Component that alerts if you click outside of it
 */
function OutsideAlerter(props) {
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, props.outsideClick);
  return <div ref={wrapperRef}>{props.children}</div>;
}

Multiselect.defaultProps = {
  options: [],
  disablePreSelectedValues: false,
  selectedValues: [],
  isObject: true,
  displayValue: "model",
  showCheckbox: false,
  selectionLimit: -1,
  placeholder: <Trans>"Select"</Trans>,
  style: {},
  emptyRecordMsg: <Trans>"No Options Available"</Trans>,
  onApply: () => {},
  onSelect: () => {},
  onRemove: () => {},
  onKeyPressFn: () => {},
  onFocusInput: () => {},
  caseSensitiveSearch: false,
  id: "",
  name: "",
  closeOnSelect: true,
  avoidHighlightFirstOption: false,
  hidePlaceholder: false,
  showArrow: false,
  keepSearchTerm: false,
  className: "",
  customArrow: undefined,
  selectedValueDecorator: (v) => v,
  optionValueDecorator: (v) => v,
  previewSelectedNum: 5,
} as IMultiselectProps;
