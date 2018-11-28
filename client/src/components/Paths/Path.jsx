import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';
import PathForm from './PathForm';
import ConfirmationDialog from '../ConfirmationDialog';
import * as api from '../../api/paths';
import { IS_LOADING, INACTIVE, HAS_ERRORED } from '../../constants';

class Path extends Component {
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

  setRequestState = newStatus => (
    this.setState(prevState => ({
      requestStates: { ...prevState.requestStates, ...newStatus }
    }))
  )

  promptConfirmDeletion = (e) => {
    e.stopPropagation();
    this.setState({ confirmingDeletion: true });
  }

  cancelDeletion = () => {
    this.setState({ confirmingDeletion: false });
  };

  startUpdates = (e) => {
    e.stopPropagation();
    this.setState({ updatingPath: true });
  }

  cancelUpdates = () => {
    this.setState({ updatingPath: false });
  }

  startDuplication = (e) => {
    e.stopPropagation();
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
    api.updatePath(id, path)
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
    await api.deletePath(path._id)
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
    const { path, choose } = this.props;

    return (
      <article className="paths paths__path-wrapper">
        <ConfirmationDialog
          isOpen={confirmingDeletion}
          onClose={this.cancelDeletion}
          cancel={this.cancelDeletion}
          accept={this.deletePath}
          isLoading={requestStates.deletePath === IS_LOADING}
          title="Confirm deletion"
          text={`Are you sure you want to delete path "${path.title}"`}
        />
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
        <button type="button" onClick={() => choose(path)} className="path button--seamless">
          {path.title}
          <div className="paths__actions">
            <i><Icon icon="duplicate" onClick={this.startDuplication} /></i>
            <i><Icon icon="edit" onClick={this.startUpdates} /></i>
            <i><Icon icon="trash" onClick={this.promptConfirmDeletion} /></i>
          </div>
        </button>
      </article>
    );
  }
}

Path.propTypes = {
  path: PropTypes.shape({
    title: PropTypes.string.isRequired,
    modules: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  choose: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired,
  delete: PropTypes.func.isRequired,
  duplicate: PropTypes.func.isRequired
};

export default Path;
