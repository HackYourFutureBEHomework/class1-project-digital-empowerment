import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Popover, Card } from '@blueprintjs/core';
import APIComponent from '../APIComponent';
import PathForm from './PathForm';
import ConfirmationContent from '../ConfirmationContent';
import { IS_LOADING, INACTIVE, HAS_ERRORED } from '../../constants';

class Path extends APIComponent {
  state = {
    confirmingDeletion: false,
    updatingPath: false,
    duplicatingPath: false,
    requestStates: {
      deletePath: INACTIVE,
      updatePath: INACTIVE,
      duplicatePath: INACTIVE
    }
  };

  promptConfirmDeletion = () => {
    this.setState({ confirmingDeletion: true });
  }

  cancelDeletion = () => {
    this.setState({ confirmingDeletion: false });
  };

  startUpdates = () => {
    this.setState({ updatingPath: true });
  }

  cancelUpdates = () => {
    this.setState({ updatingPath: false });
  }

  startDuplication = () => {
    this.setState({ duplicatingPath: true });
  }

  cancelDuplication = () => {
    this.setState({ duplicatingPath: false });
  }

  duplicatePath = async (path) => {
    await this.setRequestState({ duplicatePath: IS_LOADING });
    await this.props.duplicate({ ...path, modules: this.props.path.modules });
    this.setRequestState({ duplicatePath: INACTIVE });
    this.setState({ duplicatingPath: false });
  }

  updatePath = async (id, path) => {
    await this.setRequestState({ updatePath: IS_LOADING });
    this.api.paths.update(id, path)
      .then(async (updatedPath) => {
        await this.props.update(updatedPath);
        await this.setRequestState({ updatePath: INACTIVE });
        this.setState({ updatingPath: false });
      })
      .catch(() => {
        this.setRequestState({ updatePath: HAS_ERRORED });
      });
  }

  deletePath = async () => {
    const { path } = this.props;
    await this.setRequestState({ deletePath: IS_LOADING });
    await this.api.paths.delete(path._id)
      .then(async () => {
        await this.setRequestState({ deletePath: INACTIVE });
        this.props.delete(path._id);
      })
      .catch(() => {
        this.setRequestState({ deletePath: HAS_ERRORED });
      });
  }

  render() {
    const {
      confirmingDeletion, updatingPath, duplicatingPath, requestStates
    } = this.state;
    const { path, choose, user } = this.props;

    return (
      <article className="path-wrapper">
        <PathForm
          path={path}
          isShown={updatingPath}
          onClose={this.cancelUpdates}
          submit={this.updatePath}
          requestStatus={requestStates.updatePath}
        />
        <PathForm
          isShown={duplicatingPath}
          onClose={this.cancelDuplication}
          submit={this.duplicatePath}
          requestStatus={requestStates.duplicatePath}
        />
        <Card interactive onClick={() => choose(path)} elevation={2} className="path">
          <h5>{path.title}</h5>
        </Card>
        { user && (
          <div className="paths__actions">
            <i><Icon icon="duplicate" onClick={this.startDuplication} /></i>
            <i><Icon icon="edit" onClick={this.startUpdates} /></i>
            <Popover
              enforceFocus={false}
              isOpen={confirmingDeletion}
              onClose={this.cancelDeletion}
              position="bottom-right"
              popoverClassName="bp3-popover-content-sizing"
              className="pahts__actions__delete"
            >
              <i><Icon icon="trash" onClick={this.promptConfirmDeletion} /></i>
              <ConfirmationContent
                message={(
                  <p>
                    Are you sure you want to delete this learning path and all of its modules?<br />
                    This cannot be undone.
                  </p>
                )}
                cancel={this.cancelDeletion}
                accept={this.deletePath}
                isLoading={requestStates.deletePath === IS_LOADING}
              />
            </Popover>
          </div>
        )}
      </article>
    );
  }
}

Path.defaultProps = {
  user: null
};

Path.propTypes = {
  path: PropTypes.shape({
    title: PropTypes.string.isRequired,
    modules: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  choose: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired,
  delete: PropTypes.func.isRequired,
  duplicate: PropTypes.func.isRequired,
  user: PropTypes.shape({})
};

export default Path;
