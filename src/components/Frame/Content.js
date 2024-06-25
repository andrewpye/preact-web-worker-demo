import { Component } from 'https://unpkg.com/preact@latest?module';

export default class Content extends Component {
  componentDidMount() {
    this.props.contentDidMount();
  }

  componentDidUpdate() {
    this.props.contentDidUpdate();
  }

  render() {
    return this.props.children;
  }
}
