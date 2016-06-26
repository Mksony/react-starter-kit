import React, {
  Component,
  PropTypes,
} from 'react';
import ReactHeight from 'react-height';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './FullPageSlide.css';
import withViewport from '../../withViewport';

class FullPageSlide extends Component {

  static propTypes = {
    children: PropTypes.element.isRequired,
  };

  constructor() {
    super();
    this.state = {
      dimensions: { height: '' },
      wrapperHeight: '',
    };
  }

  componentWillReceiveProps(nextProps) {
    this.handleWrapperHeight(nextProps, this.state);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.dimensions.height === '') {
      this.handleWrapperHeight(this.props, this.state);
    }
  }

  setHeight(height) {
    this.setState({ dimensions: { height } });
  }

  isSmallerOrEqualsViewport(viewport, elemHeight) {
    return viewport.height >= elemHeight;
  }

  isBiggerThanViewPort(viewport, elemHeight) {
    return viewport.height < elemHeight;
  }

  handleWrapperHeight(props, state) {
    const elemHeight = state.dimensions.height;
    const { viewport } = props;
    if (this.isBiggerThanViewPort(viewport, elemHeight)) {
      this.setState({ wrapperHeight: 'auto' }); // eslint-disable-line no-did-update-set-state
    } else if (this.isSmallerOrEqualsViewport(viewport, elemHeight)) {
      this.setState({ wrapperHeight: '' });
    }
  }

  render() {
    const { children } = this.props;
    return (
      <section className={s.root} style={{ height: this.state.wrapperHeight }}>
        <div className={s.content}>
          <ReactHeight onHeightReady={(height) => this.setHeight(height)}>
            <div className={s.container}>
              {children}
            </div>
          </ReactHeight>
        </div>
      </section>
    );
  }
}

export default withStyles(s)(withViewport(FullPageSlide));

